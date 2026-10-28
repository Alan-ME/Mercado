import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../config.js';
import { bootstrap } from '../bootstrap.js';
import { buildApp } from '../app.js';

let app: FastifyInstance;
let festival: { userIds: string[] };
let hotel: { userIds: string[] };

const H = (sub: string) => ({ 'x-tenant-id': sub, 'content-type': 'application/json' });

async function usersOf(subdomain: string): Promise<string[]> {
  const res = await app.inject({ method: 'GET', url: '/api/v1/dev/users', headers: H(subdomain) });
  return (res.json() as { userId: string }[]).map((u) => u.userId);
}

beforeAll(async () => {
  const config = { ...loadConfig(), logLevel: 'silent' };
  const { ctx } = await bootstrap(config);
  app = await buildApp(ctx, config);
  festival = { userIds: await usersOf('festival') };
  hotel = { userIds: await usersOf('hotel') };
});

afterAll(async () => {
  await app.close();
  await app.ctx.db.close();
});

describe('Ciclo de vida completo P2P (US-01..US-06)', () => {
  it('checkout -> publicar -> comprar -> canjear, con split correcto y auditoría en 0 (QA-03)', async () => {
    const [ana, beto] = festival.userIds;

    // US-01: checkout primario
    const checkout = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('festival'),
      payload: { nominalPrice: 100, buyerId: ana, productName: 'Test VIP' },
    });
    expect(checkout.statusCode).toBe(201);
    const coupon = checkout.json() as { couponId: string; state: string };
    expect(coupon.state).toBe('EN_WALLET');

    // US-03: publicar a $150 (festival: seller 3%, buyer 2%)
    const publish = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('festival'),
      payload: { couponId: coupon.couponId, sellerId: ana, askingPrice: 150 },
    });
    expect(publish.statusCode).toBe(201);
    const order = publish.json() as { orderId: string; commissionBreakdown: Record<string, number> };
    expect(order.commissionBreakdown.sellerFeeAmount).toBe(4.5);
    expect(order.commissionBreakdown.buyerFeeAmount).toBe(3.0);
    expect(order.commissionBreakdown.netSellerProceeds).toBe(145.5);
    expect(order.commissionBreakdown.totalBuyerPrice).toBe(153.0);

    // US-04: comprar (beto)
    const buy = await app.inject({
      method: 'POST',
      url: `/api/v1/p2p/orders/${order.orderId}/buy`,
      headers: H('festival'),
      payload: { buyerId: beto },
    });
    expect(buy.statusCode).toBe(200);
    expect((buy.json() as { status: string }).status).toBe('MATCHED');

    // US-02: token QR del nuevo propietario
    const qr = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${coupon.couponId}/qr-token`,
      headers: H('festival'),
    });
    expect(qr.statusCode).toBe(200);
    const token = (qr.json() as { token: string }).token;

    // US-06: canje en TPV
    const redeem = await app.inject({
      method: 'POST',
      url: '/api/v1/tpv/validate-qr',
      headers: H('festival'),
      payload: { token },
    });
    expect(redeem.statusCode).toBe(200);
    expect((redeem.json() as { releasedToMerchant: number }).releasedToMerchant).toBe(100);

    // QA-03: auditoría balanceada
    const cfg = await app.inject({ method: 'GET', url: '/api/v1/tenant/config', headers: H('festival') });
    const realTenantId = (cfg.json() as { tenantId: string }).tenantId;
    const audit = await app.inject({
      method: 'GET',
      url: `/api/v1/escrow/audit/${realTenantId}`,
      headers: H('festival'),
    });
    expect(audit.statusCode).toBe(200);
    expect((audit.json() as { difference: number; isBalanced: boolean }).difference).toBe(0);
    expect((audit.json() as { isBalanced: boolean }).isBalanced).toBe(true);
  });
});

describe('QA-01: Price Collar => HTTP 422', () => {
  it('rechaza un precio por encima del techo', async () => {
    const [ana] = festival.userIds;
    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('festival'),
      payload: { nominalPrice: 100, buyerId: ana },
    });
    const couponId = (co.json() as { couponId: string }).couponId;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('festival'),
      payload: { couponId, sellerId: ana, askingPrice: 9999 },
    });
    expect(res.statusCode).toBe(422);
    expect((res.json() as { errorCode: string }).errorCode).toBe('PRICE_COLLAR_VIOLATION');
  });
});

describe('QA-02: concurrencia => exactamente 1 ganador', () => {
  it('50 compradores simultáneos sobre la misma orden: 1 OK, 49 rechazados', async () => {
    const [ana] = festival.userIds;
    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('festival'),
      payload: { nominalPrice: 100, buyerId: ana },
    });
    const couponId = (co.json() as { couponId: string }).couponId;
    const pub = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('festival'),
      payload: { couponId, sellerId: ana, askingPrice: 120 },
    });
    const orderId = (pub.json() as { orderId: string }).orderId;

    const attempts = await Promise.all(
      Array.from({ length: 50 }, () =>
        app.inject({
          method: 'POST',
          url: `/api/v1/p2p/orders/${orderId}/buy`,
          headers: H('festival'),
          payload: { buyerId: randomUUID() },
        }),
      ),
    );
    const ok = attempts.filter((a) => a.statusCode === 200);
    const rejected = attempts.filter((a) => a.statusCode === 423 || a.statusCode === 409);
    expect(ok).toHaveLength(1);
    expect(rejected).toHaveLength(49);
  });
});

describe('QA-04: aislamiento multi-tenant', () => {
  it('un cupón de festival no es visible ni auditable desde hotel', async () => {
    const [ana] = festival.userIds;
    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('festival'),
      payload: { nominalPrice: 100, buyerId: ana },
    });
    const couponId = (co.json() as { couponId: string }).couponId;

    // La wallet del mismo owner bajo el tenant 'hotel' no ve el cupón de 'festival'.
    const walletHotel = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/my-wallet?ownerId=${ana}`,
      headers: H('hotel'),
    });
    const ids = (walletHotel.json() as { couponId: string }[]).map((c) => c.couponId);
    expect(ids).not.toContain(couponId);

    // Un subdominio inexistente => TENANT_NOT_FOUND (404).
    const unknown = await app.inject({
      method: 'GET',
      url: '/api/v1/tenant/config',
      headers: { 'x-tenant-id': 'no-existe-xyz' },
    });
    expect(unknown.statusCode).toBe(404);
    expect((unknown.json() as { errorCode: string }).errorCode).toBe('TENANT_NOT_FOUND');
  });

  it('el token QR de un tenant no valida en otro', async () => {
    const [diego] = hotel.userIds;
    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('hotel'),
      payload: { nominalPrice: 100, buyerId: diego },
    });
    const couponId = (co.json() as { couponId: string }).couponId;
    const qr = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${couponId}/qr-token`,
      headers: H('hotel'),
    });
    const token = (qr.json() as { token: string }).token;

    // Intentar canjear ese token bajo 'festival' debe fallar (401 firma inválida).
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tpv/validate-qr',
      headers: H('festival'),
      payload: { token },
    });
    expect(res.statusCode).toBe(401);
  });
});
