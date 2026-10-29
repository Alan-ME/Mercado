import type { Queryable } from '../db/database.js';
import { moneyStr } from '@smcta/shared';
import type { CouponState } from '@smcta/shared';
import { type CouponRow } from './mappers.js';

const COLS = `coupon_id, tenant_id, current_owner_id, nominal_price, state,
  qr_encrypted_token, expiration_date, product_name, token_version, created_at`;

export async function insertCoupon(
  db: Queryable,
  input: {
    tenantId: string;
    ownerId: string;
    nominalPrice: number;
    expirationDate: Date;
    productName: string;
  },
): Promise<CouponRow> {
  const { rows } = await db.query<CouponRow>(
    `INSERT INTO coupons (tenant_id, current_owner_id, nominal_price, state, expiration_date, product_name)
     VALUES ($1, $2, $3, 'EN_WALLET', $4, $5)
     RETURNING ${COLS}`,
    [input.tenantId, input.ownerId, moneyStr(input.nominalPrice), input.expirationDate.toISOString(), input.productName],
  );
  return rows[0]!;
}

export async function findCouponById(
  db: Queryable,
  tenantId: string,
  couponId: string,
): Promise<CouponRow | null> {
  const { rows } = await db.query<CouponRow>(
    `SELECT ${COLS} FROM coupons WHERE tenant_id = $1 AND coupon_id = $2`,
    [tenantId, couponId],
  );
  return rows[0] ?? null;
}

export async function findCouponsByOwner(
  db: Queryable,
  tenantId: string,
  ownerId: string,
): Promise<CouponRow[]> {
  const { rows } = await db.query<CouponRow>(
    `SELECT ${COLS} FROM coupons
     WHERE tenant_id = $1 AND current_owner_id = $2
     ORDER BY created_at DESC`,
    [tenantId, ownerId],
  );
  return rows;
}

export async function updateCouponState(
  db: Queryable,
  couponId: string,
  state: CouponState,
): Promise<void> {
  await db.query(`UPDATE coupons SET state = $1 WHERE coupon_id = $2`, [state, couponId]);
}

export async function setCouponToken(
  db: Queryable,
  couponId: string,
  token: string,
): Promise<void> {
  await db.query(`UPDATE coupons SET qr_encrypted_token = $1 WHERE coupon_id = $2`, [
    token,
    couponId,
  ]);
}

// En el matching P2P no alcanza con cambiar current_owner_id: hay que regenerar el qr_encrypted_token
// y subir token_version = token_version + 1 en la misma sentencia SQL.
// Esto garantiza que cualquier QR viejo en circulación quede revocado de forma atómica e irreversible.
export async function transferAndReissue(
  tx: Queryable,
  couponId: string,
  newOwnerId: string,
  newToken: string,
): Promise<void> {
  await tx.query(
    `UPDATE coupons
     SET current_owner_id = $1, state = 'EN_WALLET',
         qr_encrypted_token = $2, token_version = token_version + 1
     WHERE coupon_id = $3`,
    [newOwnerId, newToken, couponId],
  );
}
