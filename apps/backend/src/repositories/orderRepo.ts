import type { Queryable } from '../db/database.js';
import { moneyStr } from '@smcta/shared';
import type { CommissionBreakdown } from '@smcta/shared';
import { type OrderRow } from './mappers.js';

const COLS = `order_id, tenant_id, coupon_id, seller_id, asking_price, side, status, buyer_id, created_at`;

export async function insertSellOrder(
  db: Queryable,
  input: { tenantId: string; couponId: string; sellerId: string; askingPrice: number },
): Promise<OrderRow> {
  const { rows } = await db.query<OrderRow>(
    `INSERT INTO p2p_orders (tenant_id, coupon_id, seller_id, asking_price, side, status)
     VALUES ($1, $2, $3, $4, 'SELL', 'OPEN')
     RETURNING ${COLS}`,
    [input.tenantId, input.couponId, input.sellerId, moneyStr(input.askingPrice)],
  );
  return rows[0]!;
}

export async function findOpenOrdersByTenant(
  db: Queryable,
  tenantId: string,
): Promise<OrderRow[]> {
  const { rows } = await db.query<OrderRow>(
    `SELECT ${COLS} FROM p2p_orders
     WHERE tenant_id = $1 AND status = 'OPEN'
     ORDER BY created_at ASC`, // prioridad precio-tiempo FIFO
    [tenantId],
  );
  return rows;
}

export async function findOrderById(
  db: Queryable,
  tenantId: string,
  orderId: string,
): Promise<OrderRow | null> {
  const { rows } = await db.query<OrderRow>(
    `SELECT ${COLS} FROM p2p_orders WHERE tenant_id = $1 AND order_id = $2`,
    [tenantId, orderId],
  );
  return rows[0] ?? null;
}

export async function countOpenOrdersBySeller(
  db: Queryable,
  tenantId: string,
  sellerId: string,
): Promise<number> {
  const { rows } = await db.query<{ n: string | number }>(
    `SELECT COUNT(*)::int AS n FROM p2p_orders
     WHERE tenant_id = $1 AND seller_id = $2 AND status = 'OPEN'`,
    [tenantId, sellerId],
  );
  return Number(rows[0]?.n ?? 0);
}

/** Marca la orden como MATCHED sólo si sigue OPEN. Devuelve filas afectadas (0 o 1). */
export async function matchOrderIfOpen(
  tx: Queryable,
  orderId: string,
  buyerId: string,
  breakdown: CommissionBreakdown,
): Promise<number> {
  const { rows } = await tx.query<{ order_id: string }>(
    `UPDATE p2p_orders
     SET status = 'MATCHED', buyer_id = $1,
         seller_fee_amount = $2, buyer_fee_amount = $3,
         net_seller_proceeds = $4, total_buyer_price = $5,
         matched_at = CURRENT_TIMESTAMP
     WHERE order_id = $6 AND status = 'OPEN'
     RETURNING order_id`,
    [
      buyerId,
      moneyStr(breakdown.sellerFeeAmount),
      moneyStr(breakdown.buyerFeeAmount),
      moneyStr(breakdown.netSellerProceeds),
      moneyStr(breakdown.totalBuyerPrice),
      orderId,
    ],
  );
  return rows.length;
}

export async function cancelOrder(db: Queryable, orderId: string): Promise<void> {
  await db.query(`UPDATE p2p_orders SET status = 'CANCELLED' WHERE order_id = $1`, [orderId]);
}
