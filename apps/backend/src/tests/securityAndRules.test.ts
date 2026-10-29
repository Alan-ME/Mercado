import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHmac } from 'node:crypto';
import { inspect } from 'node:util';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../config.js';
import { bootstrap } from '../bootstrap.js';
import { buildApp } from '../app.js';
import { QrSecret } from '../domain/qrSecret.js';

describe('Defensa de secretos criptográficos y reglas críticas de negocio', () => {
  let app: FastifyInstance;
  let currentTimeMs = Date.now();
  let festivalUsers: string[] = [];

  const H = (sub: string, extra?: Record<string, string>) => ({
    'x-tenant-id': sub,
    'content-type': 'application/json',
    ...extra,
  });

  beforeAll(async () => {
    const config = {
      ...loadConfig(),
      logLevel: 'silent',
      pspWebhookSecret: 'webhook-hmac-test-secret',
    };
    const { ctx } = await bootstrap(config);
    ctx.clock = { now: () => currentTimeMs };
    app = await buildApp(ctx, config);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dev/users',
      headers: H('festival'),
    });
    festivalUsers = (res.json() as { userId: string }[]).map((u) => u.userId);
  });

  afterAll(async () => {
    await app.close();
    await app.ctx.db.close();
  });

  it('redacta QrSecret en JSON, String, interpolación y util.inspect', () => {
    const raw = 'super-sensitive-hmac-secret-999';
    const secret = QrSecret.fromRaw(raw);

    expect(String(secret)).toBe('[REDACTED_QR_SECRET]');
    expect(`${secret}`).toBe('[REDACTED_QR_SECRET]');
    expect(JSON.stringify({ secret })).toBe('{"secret":"[REDACTED_QR_SECRET]"}');
    expect(inspect(secret)).toBe('[REDACTED_QR_SECRET]');
    expect(secret.unsafeUnwrap()).toBe(raw);
  });

  it('bloquea la emisión de QR por terceros no titulares (403) y sobre cupones publicados (409)', async () => {
    const [ana, beto] = festivalUsers;
    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('festival'),
      payload: { nominalPrice: 100, buyerId: ana, productName: 'VIP Seguridad' },
    });
    const { couponId } = co.json() as { couponId: string };

    // Beto intenta espiar el QR de Ana enviando su propio x-user-id
    const stolen = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${couponId}/qr-token`,
      headers: H('festival', { 'x-user-id': beto! }),
    });
    expect(stolen.statusCode).toBe(403);
    expect((stolen.json() as { errorCode: string }).errorCode).toBe('FORBIDDEN');

    // Ana publica en P2P: mientras está en oferta tampoco puede sacar QR para canjear en puerta
    await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('festival'),
      payload: { couponId, sellerId: ana, askingPrice: 110 },
    });

    const listedQr = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${couponId}/qr-token`,
      headers: H('festival', { 'x-user-id': ana! }),
    });
    expect(listedQr.statusCode).toBe(409);
    expect((listedQr.json() as { errorCode: string }).errorCode).toBe('COUPON_NOT_IN_WALLET');
  });

  it('invalida un QR viejo en el ataque boomerang A -> B -> A dentro de la ventana de 30s', async () => {
    const [ana, beto] = festivalUsers;
    currentTimeMs = Date.now();

    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('festival'),
      payload: { nominalPrice: 100, buyerId: ana, productName: 'VIP Boomerang' },
    });
    const { couponId } = co.json() as { couponId: string };

    // Ana saca su QR inicial (tokenVersion = 0)
    const oldQrRes = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${couponId}/qr-token`,
      headers: H('festival', { 'x-user-id': ana! }),
    });
    const oldToken = (oldQrRes.json() as { token: string }).token;

    // A los 5s Ana se lo vende a Beto (tokenVersion pasa a 1)
    currentTimeMs += 5_000;
    const pub1 = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('festival'),
      payload: { couponId, sellerId: ana, askingPrice: 100 },
    });
    const order1 = (pub1.json() as { orderId: string }).orderId;
    await app.inject({
      method: 'POST',
      url: `/api/v1/p2p/orders/${order1}/buy`,
      headers: H('festival'),
      payload: { buyerId: beto },
    });

    // A los 10s Beto se lo revende a Ana (tokenVersion pasa a 2, Ana vuelve a ser dueña)
    currentTimeMs += 5_000;
    const pub2 = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('festival'),
      payload: { couponId, sellerId: beto, askingPrice: 100 },
    });
    const order2 = (pub2.json() as { orderId: string }).orderId;
    await app.inject({
      method: 'POST',
      url: `/api/v1/p2p/orders/${order2}/buy`,
      headers: H('festival'),
      payload: { buyerId: ana },
    });

    // Todavía estamos dentro de los 30s del QR viejo, y Ana es dueña otra vez, pero tokenVersion cambió
    const replayAttempt = await app.inject({
      method: 'POST',
      url: '/api/v1/tpv/validate-qr',
      headers: H('festival'),
      payload: { token: oldToken },
    });
    expect(replayAttempt.statusCode).toBe(401);
    expect((replayAttempt.json() as { errorCode: string }).errorCode).toBe('INVALID_QR_SIGNATURE');

    // El QR nuevo (tokenVersion = 2) sí pasa limpio
    const freshQrRes = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${couponId}/qr-token`,
      headers: H('festival', { 'x-user-id': ana! }),
    });
    const freshRedeem = await app.inject({
      method: 'POST',
      url: '/api/v1/tpv/validate-qr',
      headers: H('festival'),
      payload: { token: (freshQrRes.json() as { token: string }).token },
    });
    expect(freshRedeem.statusCode).toBe(200);
  });

  it('rechaza emisión de QR y canje en TPV cuando el cupón ya superó su expiration_date', async () => {
    const [ana] = festivalUsers;
    currentTimeMs = Date.now();
    const shortExp = new Date(currentTimeMs + 10_000).toISOString();

    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('festival'),
      payload: { nominalPrice: 80, buyerId: ana, productName: 'Entrada Efímera', expirationDate: shortExp },
    });
    const { couponId } = co.json() as { couponId: string };

    // Emitimos QR 2s antes de que venza el cupón
    currentTimeMs += 8_000;
    const qrBeforeExp = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${couponId}/qr-token`,
      headers: H('festival', { 'x-user-id': ana! }),
    });
    expect(qrBeforeExp.statusCode).toBe(200);
    const validSigToken = (qrBeforeExp.json() as { token: string }).token;

    // Avanzamos 5s: el QR todavía tiene < 30s de edad, pero el cupón ya venció hace 3s
    currentTimeMs += 5_000;
    const tpvAfterExp = await app.inject({
      method: 'POST',
      url: '/api/v1/tpv/validate-qr',
      headers: H('festival'),
      payload: { token: validSigToken },
    });
    expect(tpvAfterExp.statusCode).toBe(409);

    const qrAfterExp = await app.inject({
      method: 'GET',
      url: `/api/v1/coupons/${couponId}/qr-token`,
      headers: H('festival', { 'x-user-id': ana! }),
    });
    expect(qrAfterExp.statusCode).toBe(409);
  });

  it('aplica tope diario de reventas (máx 5 en 24h) acumulando órdenes MATCHED y no sólo OPEN', async () => {
    const [, , caro] = festivalUsers;
    const [ana] = festivalUsers;
    currentTimeMs = Date.now();

    // Caro compra 6 cupones primarios, publica 5 y Ana se los compra todos (pasan a MATCHED)
    const couponIds: string[] = [];
    for (let i = 0; i < 6; i++) {
      const co = await app.inject({
        method: 'POST',
        url: '/api/v1/checkout/primary',
        headers: H('festival'),
        payload: { nominalPrice: 100, buyerId: caro, productName: `Lote #${i}` },
      });
      couponIds.push((co.json() as { couponId: string }).couponId);
    }

    for (let i = 0; i < 5; i++) {
      const pub = await app.inject({
        method: 'POST',
        url: '/api/v1/p2p/orders',
        headers: H('festival'),
        payload: { couponId: couponIds[i], sellerId: caro, askingPrice: 100 },
      });
      expect(pub.statusCode).toBe(201);
      const { orderId } = pub.json() as { orderId: string };
      const buy = await app.inject({
        method: 'POST',
        url: `/api/v1/p2p/orders/${orderId}/buy`,
        headers: H('festival'),
        payload: { buyerId: ana },
      });
      expect(buy.statusCode).toBe(200);
    }

    // La 6ta publicación dentro de las 24h debe rebotar con 429 aunque tenga 0 órdenes OPEN
    const sixth = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('festival'),
      payload: { couponId: couponIds[5], sellerId: caro, askingPrice: 100 },
    });
    expect(sixth.statusCode).toBe(429);
    expect((sixth.json() as { errorCode: string }).errorCode).toBe('DAILY_RESALE_LIMIT_REACHED');
  });

  it('contabiliza comisiones netas exactas y ejecuta webhook-release idempotente bajo concurrencia', async () => {
    // Usamos el tenant sneakers (3.5% seller + 2.5% buyer = 6% total, platformShare 30%)
    const usersRes = await app.inject({
      method: 'GET',
      url: '/api/v1/dev/users',
      headers: H('sneakers'),
    });
    const [fabio, gina] = (usersRes.json() as { userId: string }[]).map((u) => u.userId);
    const cfgRes = await app.inject({
      method: 'GET',
      url: '/api/v1/tenant/config',
      headers: H('sneakers'),
    });
    const { tenantId } = cfgRes.json() as { tenantId: string };

    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('sneakers'),
      payload: { nominalPrice: 200, buyerId: fabio, productName: 'Jordan Audit' },
    });
    const { couponId } = co.json() as { couponId: string };

    // Reventa a $200 => sellerFee $7 + buyerFee $5 = $12 total; platform 30% = $3.60, tenant neto = $8.40
    const pub = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('sneakers'),
      payload: { couponId, sellerId: fabio, askingPrice: 200 },
    });
    const { orderId } = pub.json() as { orderId: string };
    await app.inject({
      method: 'POST',
      url: `/api/v1/p2p/orders/${orderId}/buy`,
      headers: H('sneakers'),
      payload: { buyerId: gina },
    });

    // Gina lo vuelve a dejar publicado y justo cae un webhook REFUND duplicado en paralelo
    await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('sneakers'),
      payload: { couponId, sellerId: gina, askingPrice: 200 },
    });

    const bodyObj = { couponId, transactionType: 'REFUND' };
    const bodyStr = JSON.stringify(bodyObj);
    const validHmac = createHmac('sha256', 'webhook-hmac-test-secret').update(bodyStr).digest('hex');

    // Sin firma HMAC debe rebotar con 403
    const unsigned = await app.inject({
      method: 'POST',
      url: '/api/v1/escrow/webhook-release',
      headers: H('sneakers'),
      payload: bodyStr,
    });
    expect(unsigned.statusCode).toBe(403);

    // 5 reintentos concurrentes del PSP con firma válida: sólo 1 libera $200, los otros 4 devuelven released: 0
    const concurrentReleases = await Promise.all(
      Array.from({ length: 5 }, () =>
        app.inject({
          method: 'POST',
          url: '/api/v1/escrow/webhook-release',
          headers: H('sneakers', { 'x-psp-signature': validHmac }),
          payload: bodyStr,
        }),
      ),
    );
    expect(concurrentReleases.every((r) => r.statusCode === 200)).toBe(true);
    const totalReleased = concurrentReleases.reduce(
      (acc, r) => acc + (r.json() as { released: number }).released,
      0,
    );
    expect(totalReleased).toBe(200);

    // La orden P2P que había dejado Gina quedó cancelada y la auditoría cierra al centavo
    const openOrders = await app.inject({
      method: 'GET',
      url: '/api/v1/p2p/orders',
      headers: H('sneakers'),
    });
    expect((openOrders.json() as { couponId: string }[]).some((o) => o.couponId === couponId)).toBe(false);

    const audit = await app.inject({
      method: 'GET',
      url: `/api/v1/escrow/audit/${tenantId}`,
      headers: H('sneakers'),
    });
    const auditBody = audit.json() as {
      difference: number;
      isBalanced: boolean;
      tenantFeesAccumulated: number;
      platformFeesAccumulated: number;
    };
    expect(auditBody.isBalanced).toBe(true);
    expect(auditBody.difference).toBe(0);
    expect(auditBody.tenantFeesAccumulated).toBe(8.4);
    expect(auditBody.platformFeesAccumulated).toBe(3.6);
  });

  it('ignora IPs crudas en Host (127.0.0.1) y acepta fallback ?tenant= cuando no hay header', async () => {
    const ipHost = await app.inject({
      method: 'GET',
      url: '/api/v1/tenant/config',
      headers: { host: '127.0.0.1:4000' },
    });
    expect(ipHost.statusCode).toBe(404);

    const queryFallback = await app.inject({
      method: 'GET',
      url: '/api/v1/tenant/config?tenant=festival',
      headers: { host: '127.0.0.1:4000' },
    });
    expect(queryFallback.statusCode).toBe(200);
    expect((queryFallback.json() as { subdomain: string }).subdomain).toBe('festival');
  });

  it('cubre configuración admin B2B, cancelación P2P, expiración de cupones y feed de actividad', async () => {
    const usersRes = await app.inject({
      method: 'GET',
      url: '/api/v1/dev/users',
      headers: H('hotel'),
    });
    const [diego] = (usersRes.json() as { userId: string }[]).map((u) => u.userId);
    const cfgRes = await app.inject({
      method: 'GET',
      url: '/api/v1/tenant/config',
      headers: H('hotel'),
    });
    const { tenantId } = cfgRes.json() as { tenantId: string };

    // Validación de rangos en portal B2B: fuera de límite -> 400; actualización válida -> 200
    const badCfg = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/tenant/config',
      headers: H('hotel'),
      payload: { sellerTakeRatePct: 99 },
    });
    expect(badCfg.statusCode).toBe(400);

    const goodCfg = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/tenant/config',
      headers: H('hotel'),
      payload: { closureHoursBeforeEvent: 2, themePrimaryColor: '#0F766E' },
    });
    expect(goodCfg.statusCode).toBe(200);

    // Publicar y cancelar orden P2P
    currentTimeMs = Date.now();
    const soonExp = new Date(currentTimeMs + 4 * 3_600_000).toISOString();
    const co = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: H('hotel'),
      payload: { nominalPrice: 150, buyerId: diego, productName: 'Noche Spa', expirationDate: soonExp },
    });
    const { couponId } = co.json() as { couponId: string };

    const pub = await app.inject({
      method: 'POST',
      url: '/api/v1/p2p/orders',
      headers: H('hotel'),
      payload: { couponId, sellerId: diego, askingPrice: 150 },
    });
    const { orderId } = pub.json() as { orderId: string };

    const cancel1 = await app.inject({
      method: 'POST',
      url: `/api/v1/p2p/orders/${orderId}/cancel`,
      headers: H('hotel'),
      payload: { sellerId: diego },
    });
    expect(cancel1.statusCode).toBe(200);

    const cancel2 = await app.inject({
      method: 'POST',
      url: `/api/v1/p2p/orders/${orderId}/cancel`,
      headers: H('hotel'),
      payload: { sellerId: diego },
    });
    expect(cancel2.statusCode).toBe(409);

    // Expiración y retención: adelantamos el reloj simulado más allá del vencimiento y corremos expire
    currentTimeMs += 5 * 3_600_000;
    const expRes = await app.inject({
      method: 'POST',
      url: '/api/v1/escrow/expire',
      headers: H('hotel'),
      payload: {},
    });
    expect(expRes.statusCode).toBe(200);
    expect((expRes.json() as { expired: number }).expired).toBeGreaterThanOrEqual(1);

    const audit = await app.inject({
      method: 'GET',
      url: `/api/v1/escrow/audit/${tenantId}`,
      headers: H('hotel'),
    });
    expect((audit.json() as { isBalanced: boolean }).isBalanced).toBe(true);

    // Feed de notificaciones e historial
    const notif = await app.inject({
      method: 'GET',
      url: `/api/v1/notifications?userId=${diego}`,
      headers: H('hotel'),
    });
    expect(notif.statusCode).toBe(200);
    expect((notif.json() as { unreadCount: number }).unreadCount).toBeGreaterThan(0);

    const markRead = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/read',
      headers: H('hotel'),
      payload: { userId: diego },
    });
    expect(markRead.statusCode).toBe(200);

    const txHistory = await app.inject({
      method: 'GET',
      url: `/api/v1/transactions?userId=${diego}&type=PRIMARY_PURCHASE`,
      headers: H('hotel'),
    });
    expect(txHistory.statusCode).toBe(200);
    expect((txHistory.json() as unknown[]).length).toBeGreaterThanOrEqual(1);
  });
});
