import { test, expect } from '@playwright/test';
import { H, usersOf, checkout } from './helpers';

/**
 * QA-04 (TASK-007): peticiones con subdominios festival.smcta.local y
 * hotel.smcta.local deben resolver tenants completamente aislados sin fuga de
 * datos entre sí.
 */
test.describe('QA-04 · aislamiento multi-tenant', () => {
  test('un cupón de festival no aparece en la wallet del mismo owner bajo hotel', async ({ request }) => {
    const [ana] = await usersOf(request, 'festival');
    const couponId = await checkout(request, 'festival', ana!);

    const wallet = await request.get(`/api/v1/coupons/my-wallet?ownerId=${ana}`, {
      headers: H('hotel'),
    });
    const ids = ((await wallet.json()) as { couponId: string }[]).map((c) => c.couponId);
    expect(ids).not.toContain(couponId);
  });

  test('subdominio inexistente => TENANT_NOT_FOUND (404)', async ({ request }) => {
    const res = await request.get('/api/v1/tenant/config', {
      headers: { 'x-tenant-id': 'inexistente-xyz' },
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).errorCode).toBe('TENANT_NOT_FOUND');
  });

  test('el token QR de hotel no valida bajo festival (firma por tenant)', async ({ request }) => {
    const [diego] = await usersOf(request, 'hotel');
    const couponId = await checkout(request, 'hotel', diego!);
    const qr = await request.get(`/api/v1/coupons/${couponId}/qr-token`, { headers: H('hotel') });
    const token = (await qr.json()).token;

    const res = await request.post('/api/v1/tpv/validate-qr', {
      headers: H('festival'),
      data: { token },
    });
    expect(res.status()).toBe(401);
  });
});
