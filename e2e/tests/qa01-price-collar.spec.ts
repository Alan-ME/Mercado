import { test, expect } from '@playwright/test';
import { H, usersOf, checkout } from './helpers';

/**
 * QA-01 (TASK-004): retornar HTTP 422 si el importe excede el techo o baja del piso
 * parametrizado en el Tenant.
 */
test.describe('QA-01 · Price Collar => HTTP 422', () => {
  test('rechaza precio por encima del techo con PRICE_COLLAR_VIOLATION', async ({ request }) => {
    const [ana] = await usersOf(request, 'festival');
    const couponId = await checkout(request, 'festival', ana!);

    const res = await request.post('/api/v1/p2p/orders', {
      headers: H('festival'),
      data: { couponId, sellerId: ana, askingPrice: 9999 },
    });

    expect(res.status()).toBe(422);
    expect((await res.json()).errorCode).toBe('PRICE_COLLAR_VIOLATION');
  });

  test('rechaza precio por debajo del piso', async ({ request }) => {
    const [ana] = await usersOf(request, 'festival');
    const couponId = await checkout(request, 'festival', ana!);

    const res = await request.post('/api/v1/p2p/orders', {
      headers: H('festival'),
      data: { couponId, sellerId: ana, askingPrice: 1 },
    });

    expect(res.status()).toBe(422);
  });

  test('acepta un precio dentro de la banda', async ({ request }) => {
    const [ana] = await usersOf(request, 'festival');
    const couponId = await checkout(request, 'festival', ana!);

    const res = await request.post('/api/v1/p2p/orders', {
      headers: H('festival'),
      data: { couponId, sellerId: ana, askingPrice: 120 },
    });

    expect(res.status()).toBe(201);
  });
});
