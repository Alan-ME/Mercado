import {
  AppError,
  ErrorCode,
  LedgerTransactionType,
  type CheckoutPrimaryRequest,
  type CouponDTO,
} from '@smcta/shared';
import type { ServiceContext } from './context.js';
import type { TenantRow } from '../repositories/mappers.js';
import { couponToDTO } from '../repositories/mappers.js';
import { insertCoupon, setCouponToken } from '../repositories/couponRepo.js';
import { insertLedgerEntry } from '../repositories/ledgerRepo.js';
import { generateQrToken } from '../domain/qrToken.js';
import { emitEvent, notifyCommittedEvents, type UserEventInput } from '../repositories/eventRepo.js';

const DEFAULT_TTL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function validateCheckoutInput(req: CheckoutPrimaryRequest): void {
  if (!req.buyerId) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'buyerId es obligatorio.');
  }
  if (!(req.nominalPrice > 0)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'nominalPrice debe ser mayor a 0.');
  }
  if (req.paymentToken === 'fail') {
    throw new AppError(ErrorCode.PAYMENT_REJECTED, 'La pasarela de pagos rechazó la transacción.');
  }
}

function resolveExpiration(expirationDate: string | undefined, nowMs: number): Date {
  return expirationDate ? new Date(expirationDate) : new Date(nowMs + DEFAULT_TTL_DAYS * DAY_MS);
}

function resolveProductName(productName: string | undefined): string {
  return productName ? productName : 'Cupón SMCTA';
}

export async function checkoutPrimary(
  ctx: ServiceContext,
  tenant: TenantRow,
  req: CheckoutPrimaryRequest,
): Promise<CouponDTO> {
  validateCheckoutInput(req);

  const nowMs = ctx.clock.now();
  const expirationDate = resolveExpiration(req.expirationDate, nowMs);
  const productName = resolveProductName(req.productName);
  const events: UserEventInput[] = [];

  const coupon = await ctx.db.transactionSerializable(async (tx) => {
    events.length = 0;
    const row = await insertCoupon(tx, {
      tenantId: tenant.tenant_id,
      ownerId: req.buyerId,
      nominalPrice: req.nominalPrice,
      expirationDate,
      productName,
    });

    await insertLedgerEntry(tx, {
      tenantId: tenant.tenant_id,
      couponId: row.coupon_id,
      transactionType: LedgerTransactionType.CHECKOUT,
      amountInEscrow: req.nominalPrice,
    });

    const { token } = generateQrToken({
      couponId: row.coupon_id,
      tenantId: tenant.tenant_id,
      ownerId: req.buyerId,
      secret: tenant.qr_secret,
      tokenVersion: 0,
      ttlMs: ctx.config.qrTtlMs,
      nowMs,
    });
    await setCouponToken(tx, row.coupon_id, token);
    row.qr_encrypted_token = token;

    const ev: UserEventInput = {
      tenantId: tenant.tenant_id,
      userId: req.buyerId,
      type: 'PRIMARY_PURCHASE',
      title: `Compra primaria: ${productName}`,
      amount: req.nominalPrice,
      relatedCouponId: row.coupon_id,
    };
    await emitEvent(tx, ev);
    events.push(ev);
    return row;
  });

  notifyCommittedEvents(ctx.eventHub, events);
  return couponToDTO(coupon);
}
