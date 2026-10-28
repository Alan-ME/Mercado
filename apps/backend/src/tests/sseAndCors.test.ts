import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../config.js';
import { bootstrap } from '../bootstrap.js';
import { buildApp } from '../app.js';

describe('CORS quirúrgico, bloqueo de rutas dev en producción y stream SSE en vivo', () => {
  let app: FastifyInstance;
  let baseUrl = '';
  let anaId = '';

  beforeAll(async () => {
    const config = {
      ...loadConfig(),
      logLevel: 'silent',
      corsOrigins: ['https://portal.cliente-b2b.ar'],
    };
    const { ctx } = await bootstrap(config);
    app = await buildApp(ctx, config);
    baseUrl = await app.listen({ port: 0, host: '127.0.0.1' });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dev/users',
      headers: { 'x-tenant-id': 'festival' },
    });
    anaId = (res.json() as { userId: string }[])[0]!.userId;
  });

  afterAll(async () => {
    await app.close();
    await app.ctx.db.close();
  });

  it('refleja sólo orígenes autorizados y bloquea orígenes externos sin usar jamás *', async () => {
    const allowedB2B = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://portal.cliente-b2b.ar' },
    });
    expect(allowedB2B.headers['access-control-allow-origin']).toBe('https://portal.cliente-b2b.ar');

    const allowedLocalSub = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://festival.smcta.local:5173' },
    });
    expect(allowedLocalSub.headers['access-control-allow-origin']).toBe(
      'http://festival.smcta.local:5173',
    );

    const evil = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://sitio-atacante.example' },
    });
    expect(evil.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('empuja eventos por SSE en tiempo real tras commit y limpia la suscripción al desconectar', async () => {
    const abortCtrl = new AbortController();
    const res = await fetch(
      `${baseUrl}/api/v1/notifications/stream?userId=${encodeURIComponent(anaId)}&tenant=festival`,
      { signal: abortCtrl.signal },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    // Primer chunk: saludo ": connected"
    const firstChunk = await reader.read();
    expect(decoder.decode(firstChunk.value)).toContain(': connected');

    // Disparamos un checkout real para Ana y esperamos el push en el stream abierto
    const checkoutPromise = app.inject({
      method: 'POST',
      url: '/api/v1/checkout/primary',
      headers: { 'x-tenant-id': 'festival', 'content-type': 'application/json' },
      payload: { nominalPrice: 90, buyerId: anaId, productName: 'Ticket Push SSE' },
    });

    const eventChunkPromise = reader.read();
    const [coRes, eventChunk] = await Promise.all([checkoutPromise, eventChunkPromise]);
    expect(coRes.statusCode).toBe(201);

    const frame = decoder.decode(eventChunk.value);
    expect(frame).toContain('event: notification');
    expect(frame).toContain('Ticket Push SSE');

    abortCtrl.abort();
    await reader.cancel().catch(() => undefined);
  });

  it('oculta /dev/* y exige x-user-id obligatorio cuando enableDevRoutes es false', async () => {
    const prodConfig = { ...loadConfig(), logLevel: 'silent', enableDevRoutes: false };
    const { ctx } = await bootstrap(prodConfig);
    const prodApp = await buildApp(ctx, prodConfig);

    try {
      const devTenants = await prodApp.inject({ method: 'GET', url: '/api/v1/dev/tenants' });
      expect(devTenants.statusCode).toBe(404);

      const devUsers = await prodApp.inject({
        method: 'GET',
        url: '/api/v1/dev/users',
        headers: { 'x-tenant-id': 'festival' },
      });
      expect(devUsers.statusCode).toBe(404);

      const co = await prodApp.inject({
        method: 'POST',
        url: '/api/v1/checkout/primary',
        headers: { 'x-tenant-id': 'festival', 'content-type': 'application/json' },
        payload: { nominalPrice: 50, buyerId: anaId, productName: 'Prod Strict' },
      });
      const { couponId } = co.json() as { couponId: string };

      const anonymousQr = await prodApp.inject({
        method: 'GET',
        url: `/api/v1/coupons/${couponId}/qr-token`,
        headers: { 'x-tenant-id': 'festival' },
      });
      expect(anonymousQr.statusCode).toBe(403);
    } finally {
      await prodApp.close();
      await prodApp.ctx.db.close();
    }
  });
});
