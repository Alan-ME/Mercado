import type { Queryable } from '../db/database.js';
import { moneyStr } from '@smcta/shared';
import type { CommissionBreakdown } from '@smcta/shared';
import type { OrderRow, OrderWithNominalRow } from './mappers.js';

const COLS = `order_id, tenant_id, coupon_id, seller_id, asking_price, requested_product_name, reward_credits_offered, side, status, buyer_id, created_at`;

export async function insertSellOrder(
  db: Queryable,
  input: {
    tenantId: string;
    couponId: string;
    sellerId: string;
    askingPrice: number;
    requestedProductName?: string;
    rewardCreditsOffered?: number;
  },
): Promise<OrderRow> {
  const { rows } = await db.query<OrderRow>(
    `INSERT INTO p2p_orders (tenant_id, coupon_id, seller_id, asking_price, requested_product_name, reward_credits_offered, side, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'SELL', 'OPEN')
     RETURNING ${COLS}`,
    [
      input.tenantId,
      input.couponId,
      input.sellerId,
      moneyStr(input.askingPrice),
      input.requestedProductName ?? '',
      input.rewardCreditsOffered ?? 0,
    ],
  );
  return rows[0]!;
}

// Traemos el nominal en un único JOIN para no hacer N+1 queries cuando el libro crece.
export async function findOpenOrdersByTenant(
  db: Queryable,
  tenantId: string,
): Promise<OrderWithNominalRow[]> {
  const { rows } = await db.query<OrderWithNominalRow>(
    `SELECT o.order_id, o.tenant_id, o.coupon_id, o.seller_id, o.asking_price,
            o.requested_product_name, o.reward_credits_offered,
            o.side, o.status, o.buyer_id, o.created_at, c.nominal_price
     FROM p2p_orders o
     JOIN coupons c ON c.coupon_id = o.coupon_id
     WHERE o.tenant_id = $1 AND o.status = 'OPEN'
     ORDER BY o.created_at ASC`,
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
  return rows[0] ? rows[0] : null;
}

// El tope anti-reventa es DIARIO (ventana móvil de 24h), no de órdenes concurrentes en vuelo.
// Contamos tanto OPEN como MATCHED; si el usuario canceló una orden por error de precio no lo penalizamos.
export async function countDailyResalesBySeller(
  db: Queryable,
  tenantId: string,
  sellerId: string,
  sinceIso: string,
): Promise<number> {
  const { rows } = await db.query<{ n: string | number }>(
    `SELECT COUNT(*)::int AS n FROM p2p_orders
     WHERE tenant_id = $1
       AND seller_id = $2
       AND status IN ('OPEN', 'MATCHED')
       AND created_at >= $3`,
    [tenantId, sellerId, sinceIso],
  );
  const first = rows[0];
  return first ? Number(first.n) : 0;
}

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

export async function cancelOrderIfOpen(tx: Queryable, orderId: string): Promise<number> {
  const { rows } = await tx.query<{ order_id: string }>(
    `UPDATE p2p_orders SET status = 'CANCELLED'
     WHERE order_id = $1 AND status = 'OPEN'
     RETURNING order_id`,
    [orderId],
  );
  return rows.length;
}

export async function cancelOpenOrdersByCoupon(tx: Queryable, couponId: string): Promise<void> {
  await tx.query(
    `UPDATE p2p_orders SET status = 'CANCELLED' WHERE coupon_id = $1 AND status = 'OPEN'`,
    [couponId],
  );
}
