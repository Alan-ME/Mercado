import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('API Gateway - Resolución Multi-Tenant (TASK-007)', () => {
  it('Debe responder 200 en /health sin requerir contexto de tenant', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('smcta-api-gateway');
  });

  it('Debe resolver el tenant mediante el subdominio en la cabecera Host (festival.smcta.local)', async () => {
    const res = await request(app)
      .get('/api/v1/tenant/config')
      .set('Host', 'festival.smcta.local');

    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe('11111111-1111-1111-1111-111111111111');
    expect(res.body.subdomain).toBe('festival');
    expect(res.body.companyName).toBe('Festival Musical Vibe');
    expect(res.body.sellerTakeRatePct).toBe(3.50);
    expect(res.body.buyerTakeRatePct).toBe(2.50);
    expect(res.body.priceFloorPct).toBe(50.00);
    expect(res.body.priceCeilingPct).toBe(200.00);
    expect(res.body.theme.primaryColor).toBe('#6B21A8');
  });

  it('Debe resolver el tenant mediante la cabecera x-tenant-id (hotel)', async () => {
    const res = await request(app)
      .get('/api/v1/tenant/config')
      .set('x-tenant-id', '22222222-2222-2222-2222-222222222222');

    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe('22222222-2222-2222-2222-222222222222');
    expect(res.body.subdomain).toBe('hotel');
    expect(res.body.companyName).toBe('Grand Hotel & Spa');
    expect(res.body.sellerTakeRatePct).toBe(5.00);
    expect(res.body.theme.primaryColor).toBe('#065F46');
  });

  it('Debe retornar HTTP 404 y código TENANT_NOT_FOUND ante subdominio desconocido', async () => {
    const res = await request(app)
      .get('/api/v1/tenant/config')
      .set('Host', 'inexistente.smcta.local');

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('TENANT_NOT_FOUND');
    expect(res.body.message).toContain('no registrado');
  });

  it('Debe retornar HTTP 404 si se hace una petición local sin subdominio ni cabecera x-tenant-id', async () => {
    const res = await request(app)
      .get('/api/v1/tenant/config')
      .set('Host', 'localhost:8080');

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('TENANT_NOT_FOUND');
  });
});
