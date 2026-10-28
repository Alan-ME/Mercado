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
import { insertCoupon } from '../repositories/couponRepo.js';
import { insertLedgerEntry } from '../repositories/ledgerRepo.js';
import { generateQrToken } from '../domain/qrToken.js';
import { setCouponToken } from '../repositories/couponRepo.js';
import { emitEvent } from '../repositories/eventRepo.js';

const DEFAULT_TTL_DAYS = 30;

/**
 * US-01 / TASK-001: Compra de cupón en checkout primario.
 * - Simula el pago vía PSP (paymentToken='fail' => rechazo).
 * - Emite el cupón en estado EN_WALLET.
 * - Registra el asiento CHECKOUT en escrow_ledgers con el valor nominal exacto (+nominal).
 * Todo dentro de una transacción SERIALIZABLE.
 */
export async function checkoutPrimary(
  ctx: ServiceContext,
  tenant: TenantRow,
  req: CheckoutPrimaryRequest,
): Promise<CouponDTO> {
  if (!req.buyerId) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'buyerId es obligatorio.');
  }
  if (!(req.nominalPrice > 0)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'nominalPrice debe ser mayor a 0.');
  }
  if (req.paymentToken === 'fail') {
    throw new AppError(ErrorCode.PAYMENT_REJECTED, 'La pasarela de pagos rechazó la transacción.');
  }

  const expirationDate = req.expirationDate
    ? new Date(req.expirationDate)
    : new Date(Date.now() + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000);

  const coupon = await ctx.db.transactionSerializable(async (tx) => {
    const row = await insertCoupon(tx, {
      tenantId: tenant.tenant_id,
      ownerId: req.buyerId,
      nominalPrice: req.nominalPrice,
      expirationDate,
      productName: req.productName ?? 'Cupón SMCTA',
    });

    // Asiento contable: los fondos de emisión ingresan a custodia (Escrow).
    await insertLedgerEntry(tx, {
      tenantId: tenant.tenant_id,
      couponId: row.coupon_id,
      transactionType: LedgerTransactionType.CHECKOUT,
      amountInEscrow: req.nominalPrice,
    });

    // Token QR inicial para el cupón recién emitido.
    const { token } = generateQrToken({
      couponId: row.coupon_id,
      tenantId: tenant.tenant_id,
      ownerId: req.buyerId,
      secret: tenant.qr_secret,
    });
    await setCouponToken(tx, row.coupon_id, token);
    row.qr_encrypted_token = token;

    await emitEvent(tx, {
      tenantId: tenant.tenant_id,
      userId: req.buyerId,
      type: 'PRIMARY_PURCHASE',
      title: `Compra primaria: ${req.productName ?? 'Cupón SMCTA'}`,
      amount: req.nominalPrice,
      relatedCouponId: row.coupon_id,
    });
    return row;
  });

  return couponToDTO(coupon);
}
