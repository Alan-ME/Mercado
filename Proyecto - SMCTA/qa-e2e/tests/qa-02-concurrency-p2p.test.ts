import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { harness } from '../src/harness/backend-core-mock';

const app = harness.app;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';

describe('QA-02 (TASK-005): Concurrencia Atómica en Compras P2P (Anti Race Condition)', () => {
  beforeEach(() => {
    harness.reset();
  });

  it('Ante 20 peticiones concurrentes simultáneas sobre la misma orden, exactamente 1 gana y 19 son bloqueadas', async () => {
    // 1. Preparar cupón y orden abierta
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_ID, nominalPrice: 100.00, userId: 'seller_orig' });
    const couponId = checkRes.body.couponId;

    const orderRes = await request(app)
      .post('/api/v1/p2p/orders')
      .send({
        tenantId: TENANT_ID,
        couponId,
        sellerId: 'seller_orig',
        askingPrice: 150.00,
      });
    const orderId = orderRes.body.orderId;

    // 2. Disparar 20 peticiones concurrentes simultáneas
    const CONCURRENT_REQUESTS = 20;
    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) => {
      return request(app)
        .post(`/api/v1/p2p/orders/${orderId}/buy`)
        .send({ buyerId: `buyer_concurrent_${idx}` });
    });

    const results = await Promise.all(promises);

    const approved = results.filter((r) => r.status === 200);
    const rejected = results.filter((r) => r.status === 423 || r.status === 409);

    // 3. Aserciones de atomicidad estricta
    expect(approved).toHaveLength(1);
    expect(rejected).toHaveLength(19);

    // Verificar motivo de rechazo en los 19 casos
    rejected.forEach((r) => {
      expect(r.body.errorCode).toBe('P2P_ORDER_LOCKED');
    });

    // 4. Verificar consistencia del cupón en base de datos
    const coupon = harness.coupons.get(couponId);
    expect(coupon).toBeDefined();
    expect(coupon?.state).toBe('EN_WALLET');
    expect(coupon?.ownerId).toMatch(/^buyer_concurrent_\d+$/);
  });
});
