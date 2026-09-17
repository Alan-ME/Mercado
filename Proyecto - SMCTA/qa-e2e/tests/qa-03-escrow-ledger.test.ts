import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { harness } from '../src/harness/backend-core-mock';

const app = harness.app;
const TENANT_ID = '11111111-1111-1111-1111-111111111111'; // Festival: Take-Rates V=3.5%, C=2.5%, Plat=30%

describe('QA-03 (TASK-006): Auditoría Contable y Conciliación Inmutable de Escrow', () => {
  beforeEach(() => {
    harness.reset();
  });

  it('Verifica que tras un ciclo completo (Checkout -> P2P Split -> Canje TPV), los libros contables cierren con $0.00 de discrepancia', async () => {
    // 1. Compra Primaria ($100 nominal)
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_ID, nominalPrice: 100.00, userId: 'user_orig' });
    const couponId = checkRes.body.couponId;

    // 2. Reventa en mercado P2P por $140.00
    const orderRes = await request(app)
      .post('/api/v1/p2p/orders')
      .send({
        tenantId: TENANT_ID,
        couponId,
        sellerId: 'user_orig',
        askingPrice: 140.00,
      });
    const orderId = orderRes.body.orderId;

    // Compra P2P
    const buyRes = await request(app)
      .post(`/api/v1/p2p/orders/${orderId}/buy`)
      .send({ buyerId: 'buyer_final' });

    expect(buyRes.status).toBe(200);
    expect(buyRes.body.split.sellerFee).toBe(4.90); // 140 * 0.035 = 4.90
    expect(buyRes.body.split.buyerFee).toBe(3.50);  // 140 * 0.025 = 3.50
    expect(buyRes.body.split.commerceFee).toBe(5.88); // 8.40 * 0.70 = 5.88
    expect(buyRes.body.split.platformFee).toBe(2.52); // 8.40 * 0.30 = 2.52

    // 3. Canje Físico en TPV
    const redeemRes = await request(app)
      .post('/api/v1/tpv/validate-qr')
      .send({ couponId, tenantId: TENANT_ID });

    expect(redeemRes.status).toBe(200);
    expect(redeemRes.body.state).toBe('CANJEADO');
    expect(redeemRes.body.amountReleased).toBe(100.00);

    // 4. Auditoría de Conciliación Contable
    const auditRes = await request(app)
      .get(`/api/v1/escrow/audit/${TENANT_ID}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.totalDeposited).toBe(100.00);
    expect(auditRes.body.totalReleased).toBe(100.00);
    expect(auditRes.body.activeCouponsRemaining).toBe(0.00);
    expect(auditRes.body.totalCommerceFees).toBe(5.88);
    expect(auditRes.body.totalPlatformFees).toBe(2.52);
    expect(auditRes.body.discrepancy).toBe(0.00);
    expect(auditRes.body.isBalanced).toBe(true);
  });
});
