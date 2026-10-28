import { test, expect } from '@playwright/test';
import { H, usersOf, tenantIdOf, checkout, publish } from './helpers';

/**
 * QA-03 (TASK-006): tras un ciclo completo (Compra Primaria -> Reventa P2P con
 * Plusvalía -> Canje TPV), los asientos de escrow_ledgers deben cuadrar y la
 * auditoría de balance debe dar diferencia exactamente 0, con precisión decimal.
 */
test('QA-03 · ciclo completo y auditoría de balance = 0', async ({ request }) => {
  const [ana, beto] = await usersOf(request, 'festival');
  const tenantId = await tenantIdOf(request, 'festival');

  const couponId = await checkout(request, 'festival', ana!, 100);
  const orderId = await publish(request, 'festival', couponId, ana!, 150);

  // Compra P2P con plusvalía
  const buy = await request.post(`/api/v1/p2p/orders/${orderId}/buy`, {
    headers: H('festival'),
    data: { buyerId: beto },
  });
  expect(buy.status()).toBe(200);
  const order = await buy.json();
  // Precisión decimal (festival: seller 3%, buyer 2%)
  expect(order.commissionBreakdown.sellerFeeAmount).toBe(4.5);
  expect(order.commissionBreakdown.buyerFeeAmount).toBe(3);
  expect(order.commissionBreakdown.netSellerProceeds).toBe(145.5);

  // Canje TPV
  const qr = await request.get(`/api/v1/coupons/${couponId}/qr-token`, { headers: H('festival') });
  const token = (await qr.json()).token;
  const redeem = await request.post('/api/v1/tpv/validate-qr', {
    headers: H('festival'),
    data: { token },
  });
  expect(redeem.status()).toBe(200);
  expect((await redeem.json()).releasedToMerchant).toBe(100);

  // Auditoría
  const audit = await request.get(`/api/v1/escrow/audit/${tenantId}`, { headers: H('festival') });
  const body = await audit.json();
  expect(body.difference).toBe(0);
  expect(body.isBalanced).toBe(true);
});
