import type { Queryable } from '../db/database.js';
import { moneyStr, type LedgerTransactionType } from '@smcta/shared';
import { toNum } from './mappers.js';

export interface LedgerEntryInput {
  tenantId: string;
  couponId: string;
  transactionType: LedgerTransactionType;
  // Delta con signo sobre el saldo en custodia:
  // +nominal en CHECKOUT primario, -nominal en REDEEM_RELEASE o REFUND, 0 en P2P_SPLIT.
  amountInEscrow: number;
  tenantFeeAccumulated?: number;
  platformFee?: number;
  relatedOrderId?: string | null;
}

export async function insertLedgerEntry(
  db: Queryable,
  e: LedgerEntryInput,
): Promise<void> {
  await db.query(
    `INSERT INTO escrow_ledgers
       (tenant_id, coupon_id, transaction_type, amount_in_escrow, tenant_fee_accumulated, platform_fee, related_order_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      e.tenantId,
      e.couponId,
      e.transactionType,
      moneyStr(e.amountInEscrow),
      moneyStr(e.tenantFeeAccumulated ?? 0),
      moneyStr(e.platformFee ?? 0),
      e.relatedOrderId ?? null,
    ],
  );
}

export interface EscrowTotals {
  totalInEscrow: number;
  tenantFeesAccumulated: number;
  platformFeesAccumulated: number;
}

export async function getEscrowTotals(
  db: Queryable,
  tenantId: string,
): Promise<EscrowTotals> {
  const { rows } = await db.query<{
    total_escrow: string | number | null;
    tenant_fees: string | number | null;
    platform_fees: string | number | null;
  }>(
    `SELECT COALESCE(SUM(amount_in_escrow),0) AS total_escrow,
            COALESCE(SUM(tenant_fee_accumulated),0) AS tenant_fees,
            COALESCE(SUM(platform_fee),0) AS platform_fees
     FROM escrow_ledgers WHERE tenant_id = $1`,
    [tenantId],
  );
  const r = rows[0]!;
  return {
    totalInEscrow: toNum(r.total_escrow ?? 0),
    tenantFeesAccumulated: toNum(r.tenant_fees ?? 0),
    platformFeesAccumulated: toNum(r.platform_fees ?? 0),
  };
}

// Suma del valor nominal de los cupones activos (EN_WALLET y PUBLICADO_P2P).
// Por definición contable, esta suma tiene que empatar exactamente con el saldo total en custodia.
export async function getLiveCouponsNominal(
  db: Queryable,
  tenantId: string,
): Promise<number> {
  const { rows } = await db.query<{ live_nominal: string | number | null }>(
    `SELECT COALESCE(SUM(nominal_price),0) AS live_nominal
     FROM coupons
     WHERE tenant_id = $1 AND state IN ('EN_WALLET','PUBLICADO_P2P')`,
    [tenantId],
  );
  return toNum(rows[0]?.live_nominal ?? 0);
}
