import {
  AppError,
  ErrorCode,
  CouponState,
  allowsRedeem,
  type CouponDTO,
} from '@smcta/shared';
import type { ServiceContext } from './context.js';
import type { CouponRow, TenantRow } from '../repositories/mappers.js';
import { couponToDTO, toNum } from '../repositories/mappers.js';
import {
  findCouponById,
  findCouponsByOwner,
  setCouponToken,
} from '../repositories/couponRepo.js';
import { generateQrToken } from '../domain/qrToken.js';

export type WalletCoupon = CouponDTO & { productName: string };

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

// Antes cualquiera que adivinara o leyera un couponId en el libro público podía pedir
// el QR firmado a nombre del dueño. Si nos mandan identidad la validamos siempre, y en
// modo producción (cuando se apagan las rutas dev) exigir identidad es obligatorio.
function assertCallerOwnsCoupon(
  coupon: CouponRow,
  requesterId: string | undefined,
  allowDemoFallback: boolean,
): void {
  if (!requesterId) {
    if (!allowDemoFallback) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Se requiere cabecera x-user-id u ownerId del titular.');
    }
    return;
  }
  if (coupon.current_owner_id !== requesterId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Solo el propietario actual del cupón puede emitir su QR.');
  }
}

function stateRejectionMessage(state: CouponState): string {
  if (state === CouponState.PUBLICADO_P2P) {
    return 'El cupón está en oferta P2P. Cancele la publicación para habilitar el canje.';
  }
  return `El cupón no está EN_WALLET (estado actual: ${state}).`;
}

function assertCouponRedeemable(coupon: CouponRow, nowMs: number): void {
  if (!allowsRedeem(coupon.state)) {
    throw new AppError(ErrorCode.COUPON_NOT_IN_WALLET, stateRejectionMessage(coupon.state), {
      couponId: coupon.coupon_id,
      state: coupon.state,
    });
  }
  if (new Date(coupon.expiration_date).getTime() <= nowMs) {
    throw new AppError(ErrorCode.COUPON_NOT_IN_WALLET, 'El cupón ya venció y no admite canje.', {
      couponId: coupon.coupon_id,
      expirationDate: coupon.expiration_date,
    });
  }
}

export async function getQrToken(
  ctx: ServiceContext,
  tenant: TenantRow,
  couponId: string,
  requesterId?: string,
): Promise<QrTokenResponse> {
  const coupon = await findCouponById(ctx.db, tenant.tenant_id, couponId);
  if (!coupon) {
    throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId });
  }

  assertCallerOwnsCoupon(coupon, requesterId, ctx.config.enableDevRoutes);
  const nowMs = ctx.clock.now();
  assertCouponRedeemable(coupon, nowMs);

  const { token, expiresAt, ttlMs } = generateQrToken({
    couponId: coupon.coupon_id,
    tenantId: tenant.tenant_id,
    ownerId: coupon.current_owner_id,
    secret: tenant.qr_secret,
    tokenVersion: toNum(coupon.token_version),
    ttlMs: ctx.config.qrTtlMs,
    nowMs,
  });
  await setCouponToken(ctx.db, coupon.coupon_id, token);

  return { token, expiresAt, ttlMs, ownerId: coupon.current_owner_id, couponId: coupon.coupon_id };
}
