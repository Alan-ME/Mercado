import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { harness } from '../src/harness/backend-core-mock';

const app = harness.app;
const TENANT_FESTIVAL = '11111111-1111-1111-1111-111111111111';
const TENANT_HOTEL = '22222222-2222-2222-2222-222222222222';

describe('QA-04 (TASK-007): Aislamiento Estricto de Inquilinos (Multi-Tenant Isolation)', () => {
  beforeEach(() => {
    harness.reset();
  });

  it('Los datos transaccionales de Festival y Hotel están 100% aislados sin fuga de datos', async () => {
    // 1. Crear cupones en Festival
    const festRes1 = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_FESTIVAL, nominalPrice: 100.00, userId: 'user_fest_1' });

    const festRes2 = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_FESTIVAL, nominalPrice: 100.00, userId: 'user_fest_2' });

    // 2. Crear cupón en Hotel
    const hotelRes = await request(app)
      .post('/api/v1/checkout/primary')
      .send({ tenantId: TENANT_HOTEL, nominalPrice: 250.00, userId: 'user_hotel_1' });

    // 3. Consultar cupones de Festival
    const listFest = await request(app)
      .get(`/api/v1/coupons/by-tenant/${TENANT_FESTIVAL}`);

    expect(listFest.status).toBe(200);
    expect(listFest.body).toHaveLength(2);
    expect(listFest.body.map((c: any) => c.couponId)).toContain(festRes1.body.couponId);
    expect(listFest.body.map((c: any) => c.couponId)).toContain(festRes2.body.couponId);
    expect(listFest.body.map((c: any) => c.couponId)).not.toContain(hotelRes.body.couponId);

    // 4. Consultar cupones de Hotel
    const listHotel = await request(app)
      .get(`/api/v1/coupons/by-tenant/${TENANT_HOTEL}`);

    expect(listHotel.status).toBe(200);
    expect(listHotel.body).toHaveLength(1);
    expect(listHotel.body[0].couponId).toBe(hotelRes.body.couponId);
    expect(listHotel.body[0].nominalPrice).toBe(250.00);

    // 5. Verificar aislamiento en Escrow Ledgers
    const auditFest = await request(app).get(`/api/v1/escrow/audit/${TENANT_FESTIVAL}`);
    const auditHotel = await request(app).get(`/api/v1/escrow/audit/${TENANT_HOTEL}`);

    expect(auditFest.body.totalDeposited).toBe(200.00);
    expect(auditHotel.body.totalDeposited).toBe(250.00);
  });
});
