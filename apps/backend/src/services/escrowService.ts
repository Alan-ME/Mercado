import {
  AppError,
  ErrorCode,
  CouponState,
  LedgerTransactionType,
  canTransition,
  isTerminal,
  d,
  money,
} from '@smcta/shared';
import type { Queryable } from '../db/database.js';
import type { ServiceContext } from './context.js';
import { type CouponRow, type TenantRow, toNum } from '../repositories/mappers.js';
import { findCouponById, updateCouponState } from '../repositories/couponRepo.js';
import { cancelOpenOrdersByCoupon } from '../repositories/orderRepo.js';
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
  redeemed: number;
  expired: number;
  redemptionRatePct: number;
}

function countFromStateMap(byState: Map<string, number>, key: string): number {
  const val = byState.get(key);
  return val === undefined ? 0 : val;
}

function computeRedemptionRate(redeemed: number, expired: number): number {
  const closed = redeemed + expired;
  return closed === 0 ? 0 : money(d(redeemed).div(closed).mul(100));
}

// Auditoría estricta de custodia en cuentas de garantía:
// Compara la sumatoria real del libro mayor (asientos CHECKOUT - RELEASE - REFUND) contra
// el valor nominal de todos los cupones que siguen vivos (EN_WALLET y PUBLICADO_P2P).
// La diferencia tiene que dar 0.00 exacto. Si da distinto de cero, hubo fuga de plata o asiento duplicado.
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
  const redeemed = countFromStateMap(byState, 'CANJEADO');
  const expired = countFromStateMap(byState, 'VENCIDO');

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
    redemptionRatePct: computeRedemptionRate(redeemed, expired),
  };
}

async function hasTerminalLedgerEntry(tx: Queryable, couponId: string): Promise<boolean> {
  const { rows } = await tx.query<{ n: string | number }>(
    `SELECT COUNT(*)::int AS n FROM escrow_ledgers
     WHERE coupon_id = $1 AND transaction_type IN ('REDEEM_RELEASE','REFUND')`,
    [couponId],
  );
  const first = rows[0];
  return first ? Number(first.n) > 0 : false;
}

async function expireSingleCoupon(
  ctx: ServiceContext,
  tenantId: string,
  couponId: string,
): Promise<boolean> {
  return withLock(ctx.lockManager, couponLockKey(couponId), ctx.config.lockTtlMs, () =>
    ctx.db.transactionSerializable(async (tx) => {
      const fresh = await findCouponById(tx, tenantId, couponId);
      if (!fresh || !canTransition(fresh.state, CouponState.VENCIDO)) {
        return false;
      }
      await cancelOpenOrdersByCoupon(tx, couponId);
      await updateCouponState(tx, couponId, CouponState.VENCIDO);
      await insertLedgerEntry(tx, {
        tenantId,
        couponId,
        transactionType: LedgerTransactionType.REDEEM_RELEASE,
        amountInEscrow: -toNum(fresh.nominal_price),
      });
      return true;
    }),
  );
}

export async function expireDueCoupons(
  ctx: ServiceContext,
  tenant: TenantRow,
): Promise<{ expired: number }> {
  const nowIso = new Date(ctx.clock.now()).toISOString();
  const { rows } = await ctx.db.query<{ coupon_id: string }>(
    `SELECT coupon_id FROM coupons
     WHERE tenant_id = $1 AND state IN ('EN_WALLET','PUBLICADO_P2P')
       AND expiration_date <= $2`,
    [tenant.tenant_id, nowIso],
  );

  let expired = 0;
  for (const c of rows) {
    const didExpire = await expireSingleCoupon(ctx, tenant.tenant_id, c.coupon_id);
    if (didExpire) expired++;
  }
  return { expired };
}

async function closeCouponIfLive(tx: Queryable, coupon: CouponRow): Promise<void> {
  if (isTerminal(coupon.state)) return;
  await cancelOpenOrdersByCoupon(tx, coupon.coupon_id);
  await updateCouponState(tx, coupon.coupon_id, CouponState.VENCIDO);
}

// Antes leían COUNT(*) afuera de la transacción y sin lock: dos reintentos simultáneos del
// webhook del PSP pasaban los dos, restaban el nominal dos veces y dejaban la orden P2P colgada.
export async function webhookRelease(
  ctx: ServiceContext,
  tenant: TenantRow,
  couponId: string,
  transactionType: LedgerTransactionType.REFUND | LedgerTransactionType.REDEEM_RELEASE,
): Promise<{ released: number }> {
  return withLock(ctx.lockManager, couponLockKey(couponId), ctx.config.lockTtlMs, () =>
    ctx.db.transactionSerializable(async (tx) => {
      const coupon = await findCouponById(tx, tenant.tenant_id, couponId);
      if (!coupon) {
        throw new AppError(ErrorCode.COUPON_NOT_FOUND, 'Cupón no encontrado.', { couponId });
      }
      if (await hasTerminalLedgerEntry(tx, couponId)) {
        return { released: 0 };
      }

      const nominal = toNum(coupon.nominal_price);
      await closeCouponIfLive(tx, coupon);
      await insertLedgerEntry(tx, {
        tenantId: tenant.tenant_id,
        couponId,
        transactionType,
        amountInEscrow: -nominal,
      });
      return { released: nominal };
    }),
  );
}
