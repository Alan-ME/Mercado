import pg from 'pg';
import { Database } from './db.js';
import { P2POrder, OrderSide, OrderStatus } from '../../domain/entities/index.js';
import Decimal from 'decimal.js';

export class OrderRepository {
  private static mapRow(row: any): P2POrder {
    return {
      orderId: row.orderId,
      tenantId: row.tenantId,
      couponId: row.couponId,
      sellerId: row.sellerId,
      askingPrice: new Decimal(row.askingPrice).toNumber(),
      side: row.side as OrderSide,
      status: row.status as OrderStatus,
      createdAt: row.createdAt
    };
  }

  public static async create(
    data: {
      orderId?: string;
      tenantId: string;
      couponId: string;
      sellerId: string;
      askingPrice: number;
      side?: OrderSide;
      status?: OrderStatus;
    },
    client?: pg.PoolClient
  ): Promise<P2POrder> {
    const sql = `
      INSERT INTO p2p_orders (
        ${data.orderId ? 'order_id,' : ''}
        tenant_id, coupon_id, seller_id, asking_price, side, status
      ) VALUES (
        ${data.orderId ? '$6,' : ''}
        $1, $2, $3, $4, $5, $6
      )
      RETURNING 
        order_id AS "orderId",
        tenant_id AS "tenantId",
        coupon_id AS "couponId",
        seller_id AS "sellerId",
        asking_price AS "askingPrice",
        side,
        status,
        created_at AS "createdAt";
    `;

    const params = [
      data.tenantId,
      data.couponId,
      data.sellerId,
      data.askingPrice,
      data.side || OrderSide.SELL,
      data.status || OrderStatus.OPEN
    ];
    if (data.orderId) params.push(data.orderId);

    const res = client
      ? await client.query(sql, params)
      : await Database.query(sql, params);

    return this.mapRow(res.rows[0]);
  }

  public static async findById(
    tenantId: string,
    orderId: string,
    client?: pg.PoolClient
  ): Promise<P2POrder | null> {
    const sql = `
      SELECT 
        order_id AS "orderId",
        tenant_id AS "tenantId",
        coupon_id AS "couponId",
        seller_id AS "sellerId",
        asking_price AS "askingPrice",
        side,
        status,
        created_at AS "createdAt"
      FROM p2p_orders
      WHERE tenant_id = $1 AND order_id = $2
      LIMIT 1;
    `;

    const res = client
      ? await client.query(sql, [tenantId, orderId])
      : await Database.query(sql, [tenantId, orderId]);

    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  public static async findOpenOrders(tenantId: string): Promise<P2POrder[]> {
    const sql = `
      SELECT 
        o.order_id AS "orderId",
        o.tenant_id AS "tenantId",
        o.coupon_id AS "couponId",
        o.seller_id AS "sellerId",
        o.asking_price AS "askingPrice",
        o.side,
        o.status,
        o.created_at AS "createdAt"
      FROM p2p_orders o
      WHERE o.tenant_id = $1 AND o.status = 'OPEN'
      ORDER BY o.created_at ASC;
    `;

    const res = await Database.query(sql, [tenantId]);
    return res.rows.map((r) => this.mapRow(r));
  }

  public static async updateStatus(
    tenantId: string,
    orderId: string,
    status: OrderStatus,
    client?: pg.PoolClient
  ): Promise<void> {
    const sql = `
      UPDATE p2p_orders
      SET status = $3
      WHERE tenant_id = $1 AND order_id = $2;
    `;

    if (client) {
      await client.query(sql, [tenantId, orderId, status]);
    } else {
      await Database.query(sql, [tenantId, orderId, status]);
    }
  }
}
