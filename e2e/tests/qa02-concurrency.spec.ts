import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { H, usersOf, checkout, publish } from './helpers';

/**
 * QA-02 (TASK-005): compras concurrentes sobre la misma orden P2P.
 * Exactamente 1 debe ser aprobada (200) y el resto rechazadas (423/409),
 * sin duplicidad de cupones ni inconsistencias.
 * (QA Checklist pide 20; la Hoja de Ruta Rol 1 §1.9 exige 50 → se prueba con 50.)
 */
test('QA-02 · concurrencia atómica: 1 ganador, 49 rechazados', async ({ request }) => {
  const [ana] = await usersOf(request, 'festival');
  const couponId = await checkout(request, 'festival', ana!);
  const orderId = await publish(request, 'festival', couponId, ana!, 120);

  const attempts = await Promise.all(
    Array.from({ length: 50 }, () =>
      request.post(`/api/v1/p2p/orders/${orderId}/buy`, {
        headers: H('festival'),
        data: { buyerId: randomUUID() },
      }),
    ),
  );

  const statuses = attempts.map((a) => a.status());
  const ok = statuses.filter((s) => s === 200);
  const rejected = statuses.filter((s) => s === 423 || s === 409);

  expect(ok).toHaveLength(1);
  expect(rejected).toHaveLength(49);
});
