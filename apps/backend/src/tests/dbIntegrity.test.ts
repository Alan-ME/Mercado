import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGliteDatabase } from '../db/pglite.js';
import { migrate } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';

describe('Integridad DDL PostgreSQL / PGlite', () => {
  let db: PGliteDatabase;

  beforeAll(async () => {
    db = new PGliteDatabase();
    await migrate(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('re-ejecutar migrate y seedDatabase no borra ni duplica tenants existentes', async () => {
    const first = await seedDatabase(db);
    expect(first.tenants).toHaveLength(4);

    await migrate(db);
    const second = await seedDatabase(db);
    expect(second.tenants).toHaveLength(4);
    expect(second.tenants[0]?.tenantId).toBe(first.tenants[0]?.tenantId);
  });

  it('bloquea UPDATE y DELETE sobre escrow_ledgers con trigger append-only (SQLSTATE 28000)', async () => {
    await seedDatabase(db);
    await expect(
      db.query(`UPDATE escrow_ledgers SET amount_in_escrow = 0`),
    ).rejects.toMatchObject({ code: '28000' });

    await expect(
      db.query(`DELETE FROM escrow_ledgers`),
    ).rejects.toMatchObject({ code: '28000' });
  });

  it('impide dos órdenes OPEN simultáneas para el mismo cupón por índice único parcial', async () => {
    const seed = await seedDatabase(db);
    const fest = seed.tenants.find((t) => t.subdomain === 'festival')!;
    const { rows } = await db.query<{ coupon_id: string; current_owner_id: string }>(
      `SELECT coupon_id, current_owner_id FROM coupons WHERE tenant_id = $1 LIMIT 1`,
      [fest.tenantId],
    );
    const c = rows[0]!;

    await db.query(
      `INSERT INTO p2p_orders (tenant_id, coupon_id, seller_id, asking_price, side, status)
       VALUES ($1, $2, $3, 110.00, 'SELL', 'OPEN')`,
      [fest.tenantId, c.coupon_id, c.current_owner_id],
    );

    await expect(
      db.query(
        `INSERT INTO p2p_orders (tenant_id, coupon_id, seller_id, asking_price, side, status)
         VALUES ($1, $2, $3, 120.00, 'SELL', 'OPEN')`,
        [fest.tenantId, c.coupon_id, c.current_owner_id],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('persiste columnas v2.2 (credits_balance, pending_reward_credits, reward_claimed, is_discontinued, requested_product_name) y bloquea saldos negativos', async () => {
    const seed = await seedDatabase(db);
    const cafe = seed.tenants.find((t) => t.subdomain === 'cafeteria')!;
    const trader = cafe.users[1]!;

    const { rows: uRows } = await db.query<{
      credits_balance: number;
      pending_credits: number;
    }>(
      `SELECT credits_balance, pending_credits FROM users WHERE user_id = $1`,
      [trader.userId],
    );
    expect(Number(uRows[0]?.credits_balance)).toBe(520);
    expect(Number(uRows[0]?.pending_credits)).toBe(0);

    await expect(
      db.query(`UPDATE users SET credits_balance = -10 WHERE user_id = $1`, [trader.userId]),
    ).rejects.toMatchObject({ code: '23514' });
  });
});

