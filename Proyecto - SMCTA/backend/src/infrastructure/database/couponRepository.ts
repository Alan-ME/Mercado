import pg from 'pg';
import { Database } from './db.js';
import { Coupon, CouponState } from '../../domain/entities/index.js';
import Decimal from 'decimal.js';

export class CouponRepository {
  private static mapRow(row: any): Coupon {
    return {
      couponId: row.couponId,
      tenantId: row.tenantId,
      currentOwnerId: row.currentOwnerId,
      nominalPrice: new Decimal(row.nominalPrice).toNumber(),
      state: row.state as CouponState,
      qrEncryptedToken: row.qrEncryptedToken,
      expirationDate: row.expirationDate,
      createdAt: row.createdAt
    };
  }

  public static async create(
    data: {
      couponId?: string;
      tenantId: string;
      currentOwnerId: string;
      nominalPrice: number;
      state: CouponState;
      qrEncryptedToken: string;
      expirationDate: string;
    },
    client?: pg.PoolClient
  ): Promise<Coupon> {
    const sql = `
      INSERT INTO coupons (
        ${data.couponId ? 'coupon_id,' : ''}
        tenant_id, current_owner_id, nominal_price, state, qr_encrypted_token, expiration_date
      ) VALUES (
        ${data.couponId ? '$7,' : ''}
        $1, $2, $3, $4, $5, $6
      )
      RETURNING 
        coupon_id AS "couponId",
        tenant_id AS "tenantId",
        current_owner_id AS "currentOwnerId",
        nominal_price AS "nominalPrice",
        state,
        qr_encrypted_token AS "qrEncryptedToken",
        expiration_date AS "expirationDate",
        created_at AS "createdAt";
    `;

    const params = [
      data.tenantId,
      data.currentOwnerId,
      data.nominalPrice,
      data.state,
      data.qrEncryptedToken,
      data.expirationDate
    ];
    if (data.couponId) params.push(data.couponId);

    const res = client 
      ? await client.query(sql, params)
      : await Database.query(sql, params);

    return this.mapRow(res.rows[0]);
  }

  public static async findById(
    tenantId: string,
    couponId: string,
    client?: pg.PoolClient
  ): Promise<Coupon | null> {
    const sql = `
      SELECT 
        coupon_id AS "couponId",
        tenant_id AS "tenantId",
        current_owner_id AS "currentOwnerId",
        nominal_price AS "nominalPrice",
        state,
        qr_encrypted_token AS "qrEncryptedToken",
        expiration_date AS "expirationDate",
        created_at AS "createdAt"
      FROM coupons
      WHERE tenant_id = $1 AND coupon_id = $2
      LIMIT 1;
    `;

    const res = client
      ? await client.query(sql, [tenantId, couponId])
      : await Database.query(sql, [tenantId, couponId]);

    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  public static async findByOwner(tenantId: string, ownerId: string): Promise<Coupon[]> {
    const sql = `
      SELECT 
        coupon_id AS "couponId",
        tenant_id AS "tenantId",
        current_owner_id AS "currentOwnerId",
        nominal_price AS "nominalPrice",
        state,
        qr_encrypted_token AS "qrEncryptedToken",
        expiration_date AS "expirationDate",
        created_at AS "createdAt"
      FROM coupons
      WHERE tenant_id = $1 AND current_owner_id = $2
      ORDER BY created_at DESC;
    `;

    const res = await Database.query(sql, [tenantId, ownerId]);
    return res.rows.map((r) => this.mapRow(r));
  }

  public static async updateState(
    tenantId: string,
    couponId: string,
    state: CouponState,
    client?: pg.PoolClient
  ): Promise<void> {
    const sql = `
      UPDATE coupons
      SET state = $3
      WHERE tenant_id = $1 AND coupon_id = $2;
    `;
    if (client) {
      await client.query(sql, [tenantId, couponId, state]);
    } else {
      await Database.query(sql, [tenantId, couponId, state]);
    }
  }

  public static async transferOwnership(
    tenantId: string,
    couponId: string,
    newOwnerId: string,
    newState: CouponState,
    newQrToken: string,
    client?: pg.PoolClient
  ): Promise<void> {
    const sql = `
      UPDATE coupons
      SET 
        current_owner_id = $3,
        state = $4,
        qr_encrypted_token = $5
      WHERE tenant_id = $1 AND coupon_id = $2;
    `;
    const params = [tenantId, couponId, newOwnerId, newState, newQrToken];
    if (client) {
      await client.query(sql, params);
    } else {
      await Database.query(sql, params);
    }
  }

  public static async countDailyResalesByUser(tenantId: string, userId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*)::int AS count
      FROM p2p_orders
      WHERE tenant_id = $1 
        AND seller_id = $2 
        AND created_at >= CURRENT_DATE;
    `;
    const res = await Database.query<{ count: number }>(sql, [tenantId, userId]);
    return res.rows[0]?.count || 0;
  }
}
