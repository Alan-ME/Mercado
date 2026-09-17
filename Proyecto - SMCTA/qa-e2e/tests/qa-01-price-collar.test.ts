import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { harness } from '../src/harness/backend-core-mock';

const app = harness.app;
const TENANT_ID = '11111111-1111-1111-1111-111111111111'; // Festival: Piso 50%, Techo 200%

describe('QA-01 (TASK-004): Verificación de Bandas de Precio (Price Collar)', () => {
  beforeEach(() => {
    harness.reset();
  });

  it('Debe rechazar con HTTP 422 y PRICE_COLLAR_VIOLATION si el precio excede el techo (ej: $250 sobre nominal $100)', async () => {
    // 1. Emitir cupón nominal $100
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_ID, nominalPrice: 100.00, userId: 'seller_1' });

    const couponId = checkRes.body.couponId;

    // 2. Intentar publicar orden a $250.00 (Techo es $200.00)
    const res = await request(app)
      .post('/api/v1/p2p/orders')
      .send({
        tenantId: TENANT_ID,
        couponId,
        sellerId: 'seller_1',
        askingPrice: 250.00,
      });

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('PRICE_COLLAR_VIOLATION');
    expect(res.body.details.askingPrice).toBe(250.00);
    expect(res.body.details.maxAllowed).toBe(200.00);
  });

  it('Debe rechazar con HTTP 422 si el precio cae por debajo del piso (ej: $40 sobre nominal $100)', async () => {
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_ID, nominalPrice: 100.00, userId: 'seller_1' });

    const couponId = checkRes.body.couponId;

    const res = await request(app)
      .post('/api/v1/p2p/orders')
      .send({
        tenantId: TENANT_ID,
        couponId,
        sellerId: 'seller_1',
        askingPrice: 40.00, // Piso es $50.00
      });

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('PRICE_COLLAR_VIOLATION');
    expect(res.body.details.minAllowed).toBe(50.00);
  });

  it('Debe aprobar con HTTP 201 una orden con precio dentro de la banda ($150.00)', async () => {
    const checkRes = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_ID, nominalPrice: 100.00, userId: 'seller_1' });

    const couponId = checkRes.body.couponId;

    const res = await request(app)
      .post('/api/v1/p2p/orders')
      .send({
        tenantId: TENANT_ID,
        couponId,
        sellerId: 'seller_1',
        askingPrice: 150.00,
      });

    expect(res.status).toBe(201);
    expect(res.body.askingPrice).toBe(150.00);
    expect(res.body.status).toBe('OPEN');
  });
});
