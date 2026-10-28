import {
  AppError,
  ErrorCode,
  CouponState,
  LedgerTransactionType,
  d,
  money,
} from '@smcta/shared';
import type { ServiceContext } from './context.js';
import { type TenantRow, toNum } from '../repositories/mappers.js';
import { findCouponById, updateCouponState } from '../repositories/couponRepo.js';
import {
  getEscrowTotals,
  getLiveCouponsNominal,
  insertLedgerEntry,
} from '../repositories/ledgerRepo.js';
import { couponLockKey, withLock } from '../infra/lockManager.js';

export interface EscrowAudit {
  tenantId: string;
  totalInEscrow: number;
  expectedLiveNominal: number;
  difference: number;
  isBalanced: boolean;
  tenantFeesAccumulated: number;
  platformFeesAccumulated: number;
  // Analítica de canjes (Propuesta §6.2 - Monitor de Salud Financiera y Escrow).
  redeemed: number;
  expired: number;
  redemptionRatePct: number;
}

/**
 * TASK-006 / QA-03: audita que el saldo en custodia coincida EXACTAMENTE con el
 * valor nominal de los cupones vivos (EN_WALLET + PUBLICADO_P2P). Diferencia = 0.
 */
export async function auditEscrow(
  ctx: ServiceContext,
  tenant: TenantRow,
): Promise<EscrowAudit> {
  const totals = await getEscrowTotals(ctx.db, tenant.tenant_id);
  const expected = await getLiveCouponsNominal(ctx.db, tenant.tenant_id);
  const difference = money(d(totals.totalInEscrow).minus(expected));

  const { rows } = await ctx.db.query<{ state: string; n: string | number }>(
    `SELECT state, COUNT(*)::int AS n FROM coupons WHERE tenant_id = $1 GROUP BY state`,
    [tenant.tenant_id],
  );
  const byState = new Map(rows.map((r) => [r.state, Number(r.n)]));
  const redeemed = byState.get('CANJEADO') ?? 0;
  const expired = byState.get('VENCIDO') ?? 0;
  const closed = redeemed + expired;
  const redemptionRatePct = closed === 0 ? 0 : money(d(redeemed).div(closed).mul(100));

  return {
    tenantId: tenant.tenant_id,
    totalInEscrow: totals.totalInEscrow,
    expectedLiveNominal: expected,
    difference,
    isBalanced: difference === 0,
    tenantFeesAccumulated: totals.tenantFeesAccumulated,
    platformFeesAccumulated: totals.platformFeesAccumulated,
    redeemed,
    expired,
    redemptionRatePct,
  };
}

/**
 * RN-04: expira cupones cuya ventana venció. Los pasa a VENCIDO, cancela órdenes
 * abiertas y libera el escrow al comercio (breakage). Idempotente por estado.
 */
export async function expireDueCoupons(
  ctx: ServiceContext,
  tenant: TenantRow,
): Promise<{ expired: number }> {
  const { rows } = await ctx.db.query<{ coupon_id: string; nominal_price: string | number }>(
    `SELECT coupon_id, nominal_price FROM coupons
     WHERE tenant_id = $1 AND state IN ('EN_WALLET','PUBLICADO_P2P')
       AND expiration_date <= CURRENT_TIMESTAMP`,
    [tenant.tenant_id],
  );

  for (const c of rows) {
    await withLock(ctx.lockManager, couponLockKey(c.coupon_id), ctx.config.lockTtlMs, () =>
      ctx.db.transactionSerializable(async (tx) => {
        await tx.query(
          `UPDATE p2p_orders SET status = 'CANCELLED'
           WHERE coupon_id = $1 AND status = 'OPEN'`,
          [c.coupon_id],
        );
        await updateCouponState(tx, c.coupon_id, CouponState.VENCIDO);
        await insertLedgerEntry(tx, {
          tenantId: tenant.tenant_id,
          couponId: c.coupon_id,
          transactionType: LedgerTransactionType.REDEEM_RELEASE,
          amountInEscrow: -toNum(c.nominal_price),
        });
      }),
    );
  }
  return { expired: rows.length };
}

/**
 * POST /escrow/webhook-release (Protocolo §3). Libera manualmente el escrow de un
 * cupón terminal (p. ej. reembolso/breakage disparado por el PSP). Idempotente:
 * no libera dos veces el mismo cupón.
 */
export async function webhookRelease(
  ctx: ServiceContext,
  tenant: TenantRow,
  couponId: string,
  transactionType: LedgerTransactionType.REFUND | LedgerTransactionType.REDEEM_RELEASE,
): Promise<{ released: number }> {
  const coupon = await findCouponById(ctx.db, tenant.tenant_id, couponId);
  if (!coupon) {
    throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId });
  }
  const { rows } = await ctx.db.query<{ n: string | number }>(
    `SELECT COUNT(*)::int AS n FROM escrow_ledgers
     WHERE coupon_id = $1 AND transaction_type IN ('REDEEM_RELEASE','REFUND')`,
    [couponId],
  );
  if (Number(rows[0]?.n ?? 0) > 0) {
    return { released: 0 }; // ya fue liberado
  }

  const nominal = toNum(coupon.nominal_price);
  await ctx.db.transactionSerializable(async (tx) => {
    if (coupon.state !== CouponState.CANJEADO && coupon.state !== CouponState.VENCIDO) {
      await updateCouponState(tx, couponId, CouponState.VENCIDO);
    }
    await insertLedgerEntry(tx, {
      tenantId: tenant.tenant_id,
      couponId,
      transactionType,
      amountInEscrow: -nominal,
    });
  });
  return { released: nominal };
}
