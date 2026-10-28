import { existsSync } from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { AppConfig } from './config.js';
import type { ServiceContext } from './services/context.js';
import { registerErrorHandler } from './plugins/errorHandler.js';
import { resolveTenant } from './plugins/tenantResolver.js';
import { registerTenantRoutes } from './routes/tenant.js';
import { registerCheckoutRoutes } from './routes/checkout.js';
import { registerCouponRoutes } from './routes/coupons.js';
import { registerP2PRoutes } from './routes/p2p.js';
import { registerTpvRoutes } from './routes/tpv.js';
import { registerEscrowRoutes } from './routes/escrow.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerActivityRoutes } from './routes/activity.js';
import { registerDevUserRoutes, registerPublicTenantList } from './routes/dev.js';

export async function buildApp(
  ctx: ServiceContext,
  config: AppConfig,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel },
    // Confía en el proxy de Vite para preservar el Host original en desarrollo.
    trustProxy: true,
  });

  app.decorate('ctx', ctx);
  registerErrorHandler(app);
  await app.register(cors, { origin: true, exposedHeaders: ['x-tenant-id'] });

  // Documentación OpenAPI / Swagger (Hoja de Ruta Rol 1, Tarea 1.10) en /api/docs.
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'SMCTA P2P API',
        description:
          'API del Backend Core y Motor P2P (SMCTA v2). Todas las rutas /api/v1 requieren el header x-tenant-id (o subdominio del tenant).',
        version: '2.0.0',
      },
      components: {
        securitySchemes: {
          tenant: { type: 'apiKey', in: 'header', name: 'x-tenant-id' },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/api/docs' });

  app.get('/health', async () => ({
    status: 'ok',
    engine: config.databaseUrl ? 'postgres' : 'pglite-embedded',
    lock: config.redisUrl ? 'redis' : 'in-process',
    ts: new Date().toISOString(),
  }));

  registerPublicTenantList(app, ctx);

  // Rutas de negocio: todas resuelven el tenant (TASK-007) antes del handler.
  await app.register(
    async (scoped) => {
      scoped.addHook('preHandler', async (request) => {
        await resolveTenant(ctx, request);
      });
      registerTenantRoutes(scoped);
      registerCheckoutRoutes(scoped);
      registerCouponRoutes(scoped);
      registerP2PRoutes(scoped);
      registerTpvRoutes(scoped);
      registerEscrowRoutes(scoped);
      registerAdminRoutes(scoped);
      registerActivityRoutes(scoped);
      registerDevUserRoutes(scoped);
    },
    { prefix: '/api/v1' },
  );

  // Sirve el frontend compilado si existe; si no, una página informativa.
  if (existsSync(config.webDistPath)) {
    await app.register(fastifyStatic, { root: config.webDistPath, prefix: '/' });
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api')) {
        reply.status(404).send({ errorCode: 'NOT_FOUND', message: 'Ruta no encontrada.', details: {} });
        return;
      }
      reply.sendFile('index.html'); // SPA fallback
    });
  } else {
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api')) {
        reply.status(404).send({ errorCode: 'NOT_FOUND', message: 'Ruta no encontrada.', details: {} });
        return;
      }
      reply.type('text/html').send(infoPage());
    });
  }

  return app;
}

function infoPage(): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>SMCTA API</title><style>body{font-family:system-ui;max-width:720px;margin:60px auto;padding:0 20px;color:#1a202c}
code{background:#edf2f7;padding:2px 6px;border-radius:4px}h1{color:#6D28D9}</style></head>
<body><h1>SMCTA P2P — API activa</h1>
<p>El backend está corriendo. El frontend aún no fue compilado.</p>
<p>Para ver la interfaz web ejecutá <code>npm run build:web</code> y recargá, o usá <code>npm run dev</code> para modo desarrollo con hot-reload.</p>
<p>Salud del servicio: <a href="/health">/health</a> · Tenants demo: <a href="/api/v1/dev/tenants">/api/v1/dev/tenants</a></p>
</body></html>`;
}
