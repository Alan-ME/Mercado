import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { H, usersOf, checkout, publish } from './helpers';

// QA-02: Prueba de estrés por carrera crítica. Disparamos 50 compras simultáneas con Promise.all()
// sobre una única orden P2P abierta.
// Para que esto pase sin dejar plata fantasma ni órdenes huérfanas, el lock distribuido
// y la transacción SERIALIZABLE tienen que coordinar a la perfección:
// exactamente 1 petición debe llevarse el cupón (HTTP 200) y las 49 restantes deben
// rebotar con 423 P2P_ORDER_LOCKED o 409 ORDER_NOT_OPEN sin duplicar registros en base.
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
