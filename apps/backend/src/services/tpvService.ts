import {
  AppError,
  ErrorCode,
  CouponState,
  LedgerTransactionType,
  allowsRedeem,
  canTransition,
  type QRTokenPayload,
} from '@smcta/shared';
import type { ServiceContext } from './context.js';
import { type CouponRow, type TenantRow, toNum } from '../repositories/mappers.js';
import { findCouponById, updateCouponState } from '../repositories/couponRepo.js';
import { insertLedgerEntry } from '../repositories/ledgerRepo.js';
import { couponLockKey, withLock } from '../infra/lockManager.js';
import { verifyQrToken } from '../domain/qrToken.js';
import { emitEvent, notifyCommittedEvents, type UserEventInput } from '../repositories/eventRepo.js';

export interface RedeemResult {
  couponId: string;
  state: CouponState;
  releasedToMerchant: number;
  webhook: {
    event: 'WEBHOOK_REDEEM_SUCCESS';
    couponId: string;
    tenantId: string;
    amountReleased: number;
  };
}

function isVersionMismatch(payload: QRTokenPayload, coupon: CouponRow): boolean {
  const tokenVer = payload.tokenVersion === undefined ? 0 : payload.tokenVersion;
  return tokenVer !== toNum(coupon.token_version);
}

// Validamos tanto ownerId como tokenVersion adentro del lock/transacción: si A le vendió
// el cupón a B y B se lo revendió de vuelta a A en menos de 30s, el QR viejo de A muere igual.
function assertTokenMatchesHolder(payload: QRTokenPayload, coupon: CouponRow): void {
  if (coupon.current_owner_id !== payload.ownerId) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'El token no corresponde al propietario actual del cupón.');
  }
  if (isVersionMismatch(payload, coupon)) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'El token QR quedó invalidado por una transferencia posterior.');
  }
}

function assertCanRedeemNow(coupon: CouponRow, nowMs: number): void {
  if (!allowsRedeem(coupon.state) || !canTransition(coupon.state, CouponState.CANJEADO)) {
    throw new AppError(
      ErrorCode.COUPON_NOT_IN_WALLET,
      `El cupón no puede canjearse (estado actual: ${coupon.state}).`,
      { state: coupon.state },
    );
  }
  if (new Date(coupon.expiration_date).getTime() <= nowMs) {
    throw new AppError(
      ErrorCode.COUPON_NOT_IN_WALLET,
      'El cupón se encuentra vencido y no puede canjearse en terminal.',
      { expirationDate: coupon.expiration_date },
    );
  }
}

export async function validateQrAndRedeem(
  ctx: ServiceContext,
  tenant: TenantRow,
  token: string,
): Promise<RedeemResult> {
  const nowMs = ctx.clock.now();
  const payload = verifyQrToken(token, tenant.qr_secret, ctx.config.qrTtlMs, nowMs);

  if (payload.tenantId !== tenant.tenant_id) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'El token no pertenece a este tenant.');
  }

  const events: UserEventInput[] = [];
  const nominal = await withLock(
    ctx.lockManager,
    couponLockKey(payload.couponId),
    ctx.config.lockTtlMs,
    () =>
      ctx.db.transactionSerializable(async (tx) => {
        events.length = 0;
        const fresh = await findCouponById(tx, tenant.tenant_id, payload.couponId);
        if (!fresh) {
          throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId: payload.couponId });
        }
        assertTokenMatchesHolder(payload, fresh);
        assertCanRedeemNow(fresh, ctx.clock.now());

        const amount = toNum(fresh.nominal_price);
        await updateCouponState(tx, fresh.coupon_id, CouponState.CANJEADO);
        await insertLedgerEntry(tx, {
          tenantId: tenant.tenant_id,
          couponId: fresh.coupon_id,
          transactionType: LedgerTransactionType.REDEEM_RELEASE,
          amountInEscrow: -amount,
        });
        const ev: UserEventInput = {
          tenantId: tenant.tenant_id,
          userId: fresh.current_owner_id,
          type: 'REDEEM',
          title: `Canjeaste "${fresh.product_name}"`,
          amount,
          relatedCouponId: fresh.coupon_id,
        };
        await emitEvent(tx, ev);
        events.push(ev);
        return amount;
      }),
  );

  notifyCommittedEvents(ctx.eventHub, events);
  return {
    couponId: payload.couponId,
    state: CouponState.CANJEADO,
    releasedToMerchant: nominal,
    webhook: {
      event: 'WEBHOOK_REDEEM_SUCCESS',
      couponId: payload.couponId,
      tenantId: tenant.tenant_id,
      amountReleased: nominal,
    },
  };
}
