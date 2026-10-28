import {
  AppError,
  ErrorCode,
  CouponState,
  type CouponDTO,
} from '@smcta/shared';
import type { ServiceContext } from './context.js';
import type { TenantRow } from '../repositories/mappers.js';
import { couponToDTO } from '../repositories/mappers.js';
import {
  findCouponById,
  findCouponsByOwner,
  setCouponToken,
} from '../repositories/couponRepo.js';
import { generateQrToken } from '../domain/qrToken.js';

/** Cupón enriquecido para la UI (superset aditivo del contrato CouponDTO). */
export type WalletCoupon = CouponDTO & { productName: string };

/** US-01: cupones del usuario autenticado con su estado. */
export async function getWallet(
  ctx: ServiceContext,
  tenant: TenantRow,
  ownerId: string,
): Promise<WalletCoupon[]> {
  const rows = await findCouponsByOwner(ctx.db, tenant.tenant_id, ownerId);
  return rows.map((r) => ({ ...couponToDTO(r), productName: r.product_name }));
}

export interface QrTokenResponse {
  token: string;
  expiresAt: number;
  ttlMs: number;
  ownerId: string;
  couponId: string;
}

/**
 * US-02 / TASK-003: token QR dinámico para canje.
 * - Si el cupón está PUBLICADO_P2P => COUPON_NOT_IN_WALLET (409): RN-01.
 * - Genera nonce + firma HMAC-SHA256, expira a los 30s.
 */
export async function getQrToken(
  ctx: ServiceContext,
  tenant: TenantRow,
  couponId: string,
): Promise<QrTokenResponse> {
  const coupon = await findCouponById(ctx.db, tenant.tenant_id, couponId);
  if (!coupon) {
    throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId });
  }
  if (coupon.state !== CouponState.EN_WALLET) {
    throw new AppError(
      ErrorCode.COUPON_NOT_IN_WALLET,
      coupon.state === CouponState.PUBLICADO_P2P
        ? 'El cupón está en oferta P2P. Cancele la publicación para habilitar el canje.'
        : `El cupón no está EN_WALLET (estado actual: ${coupon.state}).`,
      { couponId, state: coupon.state },
    );
  }

  const { token, expiresAt, ttlMs } = generateQrToken({
    couponId: coupon.coupon_id,
    tenantId: tenant.tenant_id,
    ownerId: coupon.current_owner_id,
    secret: tenant.qr_secret,
  });
  await setCouponToken(ctx.db, coupon.coupon_id, token);

  return { token, expiresAt, ttlMs, ownerId: coupon.current_owner_id, couponId: coupon.coupon_id };
}
