import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();
const TEST_HOST = 'festival.smcta.local';

describe('Gateway - Actualización de Configuración Tenant (US-05)', () => {
  it('Debe actualizar los take-rates válidos y retornar HTTP 200', async () => {
    const res = await request(app)
      .put('/api/v1/tenant/config')
      .set('Host', TEST_HOST)
      .send({
        sellerTakeRatePct: 4.50,
        buyerTakeRatePct: 3.00,
        maxDailyResalesPerUser: 8,
      });

    expect(res.status).toBe(200);
    expect(res.body.sellerTakeRatePct).toBe(4.50);
    expect(res.body.buyerTakeRatePct).toBe(3.00);
    expect(res.body.maxDailyResalesPerUser).toBe(8);

    // Verificar que un GET posterior devuelve los valores modificados
    const getRes = await request(app)
      .get('/api/v1/tenant/config')
      .set('Host', TEST_HOST);

    expect(getRes.status).toBe(200);
    expect(getRes.body.sellerTakeRatePct).toBe(4.50);
  });

  it('Debe rechazar con HTTP 422 si sellerTakeRatePct es superior a 10%', async () => {
    const res = await request(app)
      .put('/api/v1/tenant/config')
      .set('Host', TEST_HOST)
      .send({
        sellerTakeRatePct: 15.00, // Fuera de rango [1.0, 10.0]
      });

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('INVALID_TENANT_CONFIGURATION');
    expect(res.body.details.sellerTakeRatePct).toBeDefined();
  });

  it('Debe rechazar con HTTP 422 si priceFloorPct es menor al 10%', async () => {
    const res = await request(app)
      .put('/api/v1/tenant/config')
      .set('Host', TEST_HOST)
      .send({
        priceFloorPct: 5.00, // Fuera de rango [10.0, 90.0]
      });

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('INVALID_TENANT_CONFIGURATION');
    expect(res.body.details.priceFloorPct).toBeDefined();
  });

  it('Debe actualizar el tema visual mediante PUT /api/v1/admin/tenant/config', async () => {
    const res = await request(app)
      .put('/api/v1/admin/tenant/config')
      .set('Host', TEST_HOST)
      .send({
        theme: {
          primaryColor: '#4F46E5',
          accentColor: '#06B6D4',
          surfaceColor: '#1E1B4B',
          fontFamily: 'Inter, sans-serif',
          logoUrl: '/custom-logo.png',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.theme.primaryColor).toBe('#4F46E5');
    expect(res.body.theme.accentColor).toBe('#06B6D4');
  });
});
