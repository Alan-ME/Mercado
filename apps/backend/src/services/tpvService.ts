import {
  AppError,
  ErrorCode,
  CouponState,
  LedgerTransactionType,
} from '@smcta/shared';
import type { ServiceContext } from './context.js';
import { type TenantRow, toNum } from '../repositories/mappers.js';
import { findCouponById, updateCouponState } from '../repositories/couponRepo.js';
import { insertLedgerEntry } from '../repositories/ledgerRepo.js';
import { couponLockKey, withLock } from '../infra/lockManager.js';
import { verifyQrToken } from '../domain/qrToken.js';
import { emitEvent } from '../repositories/eventRepo.js';

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

/**
 * US-06 / TASK-008: validación de QR en el TPV.
 * - Verifica firma HMAC y antigüedad <= 30s (QR_TOKEN_EXPIRED / 401).
 * - Verifica que el cupón esté EN_WALLET y pertenezca al portador del token.
 * - Muta a CANJEADO y libera el 100% del escrow al comercio (REDEEM_RELEASE).
 */
export async function validateQrAndRedeem(
  ctx: ServiceContext,
  tenant: TenantRow,
  token: string,
): Promise<RedeemResult> {
  const payload = verifyQrToken(token, tenant.qr_secret, ctx.config.qrTtlMs);

  if (payload.tenantId !== tenant.tenant_id) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'El token no pertenece a este tenant.');
  }

  const coupon = await findCouponById(ctx.db, tenant.tenant_id, payload.couponId);
  if (!coupon) {
    throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId: payload.couponId });
  }
  // El token de un propietario anterior (post-reventa) queda invalidado.
  if (coupon.current_owner_id !== payload.ownerId) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'El token no corresponde al propietario actual del cupón.');
  }
  if (coupon.state !== CouponState.EN_WALLET) {
    throw new AppError(
      ErrorCode.COUPON_NOT_IN_WALLET,
      `El cupón no puede canjearse (estado actual: ${coupon.state}).`,
      { state: coupon.state },
    );
  }

  const nominal = toNum(coupon.nominal_price);

  await withLock(ctx.lockManager, couponLockKey(coupon.coupon_id), ctx.config.lockTtlMs, () =>
    ctx.db.transactionSerializable(async (tx) => {
      const fresh = await findCouponById(tx, tenant.tenant_id, coupon.coupon_id);
      if (!fresh || fresh.state !== CouponState.EN_WALLET) {
        throw new AppError(ErrorCode.COUPON_NOT_IN_WALLET, 'El cupón ya fue canjeado o no está disponible.');
      }
      await updateCouponState(tx, coupon.coupon_id, CouponState.CANJEADO);
      // Libera el depósito primario al comercio (delta -nominal en custodia).
      await insertLedgerEntry(tx, {
        tenantId: tenant.tenant_id,
        couponId: coupon.coupon_id,
        transactionType: LedgerTransactionType.REDEEM_RELEASE,
        amountInEscrow: -nominal,
      });
      await emitEvent(tx, {
        tenantId: tenant.tenant_id,
        userId: coupon.current_owner_id,
        type: 'REDEEM',
        title: `Canjeaste "${coupon.product_name}"`,
        amount: nominal,
        relatedCouponId: coupon.coupon_id,
      });
    }),
  );

  return {
    couponId: coupon.coupon_id,
    state: CouponState.CANJEADO,
    releasedToMerchant: nominal,
    webhook: {
      event: 'WEBHOOK_REDEEM_SUCCESS',
      couponId: coupon.coupon_id,
      tenantId: tenant.tenant_id,
      amountReleased: nominal,
    },
  };
}
