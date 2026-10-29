import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@smcta/shared';
import {
  listEvents,
  countUnread,
  markAllRead,
  type UserEventType,
} from '../repositories/eventRepo.js';

const userQuery = z.object({ userId: z.string().min(1) });
const readBody = z.object({ userId: z.string().min(1) });
const SSE_HEARTBEAT_MS = 15_000;

const TYPES: UserEventType[] = [
  'PRIMARY_PURCHASE',
  'P2P_LISTED',
  'P2P_SALE',
  'P2P_BUY',
  'REDEEM',
  'P2P_CANCELLED',
];

function parseRequiredUserId(query: unknown): string {
  const parsed = userQuery.safeParse(query);
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Parámetro userId requerido.');
  }
  return parsed.data.userId;
}

function parseOptionalEventType(query: unknown): UserEventType | undefined {
  if (!query || typeof query !== 'object') return undefined;
  const raw = (query as { type?: string }).type;
  return TYPES.includes(raw as UserEventType) ? (raw as UserEventType) : undefined;
}

// Reemplaza el polling ciego cada 20s del frontend por un canal SSE liviano con limpieza explícita:
// si el cliente cierra la pestaña cortamos el timer y desuscribimos el listener en el acto.
function streamUserNotifications(
  request: FastifyRequest,
  reply: FastifyReply,
  tenantId: string,
  userId: string,
): void {
  const rawHeaders: Record<string, string | number | string[]> = {};
  for (const [k, v] of Object.entries(reply.getHeaders())) {
    if (v !== undefined) rawHeaders[k] = v;
  }

  // Hijackeamos la respuesta de Fastify porque SSE requiere mantener el socket TCP abierto
  // escribiendo chunks directos en la conexión cruda de Node, sin que Fastify intente cerrar o serializar JSON.
  // x-accel-buffering: no le avisa a Nginx o Cloudflare que no bufferice los chunks en memoria intermedia.
  reply.hijack();
  reply.raw.writeHead(200, {
    ...rawHeaders,
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  reply.raw.write(': connected\n\n');

  const unsubscribe = request.server.ctx.eventHub.subscribe(tenantId, userId, (ev) => {
    if (!reply.raw.writableEnded) {
      reply.raw.write(`event: notification\ndata: ${JSON.stringify(ev)}\n\n`);
    }
  });

  // Los balanceadores de carga (AWS ALB, Nginx, proxies corporativos) te matan la conexión TCP
  // si pasa 30 o 60 segundos sin tráfico. El ping con un comentario SSE mantiene viva la tubería.
  const heartbeat = setInterval(() => {
    if (!reply.raw.writableEnded) {
      reply.raw.write(': ping\n\n');
    }
  }, SSE_HEARTBEAT_MS);
  heartbeat.unref();

  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    unsubscribe();
  };

  request.raw.on('close', cleanup);
  reply.raw.on('close', cleanup);
}

export function registerActivityRoutes(app: FastifyInstance): void {
  app.get('/notifications', async (request) => {
    const userId = parseRequiredUserId(request.query);
    const tenantId = request.tenant.tenant_id;
    const [events, unreadCount] = await Promise.all([
      listEvents(request.server.ctx.db, tenantId, userId, { limit: 15 }),
      countUnread(request.server.ctx.db, tenantId, userId),
    ]);
    return { unreadCount, events };
  });

  app.get('/notifications/stream', async (request, reply) => {
    const userId = parseRequiredUserId(request.query);
    streamUserNotifications(request, reply, request.tenant.tenant_id, userId);
  });

  app.post('/notifications/read', async (request) => {
    const { userId } = readBody.parse(request.body);
    await markAllRead(request.server.ctx.db, request.tenant.tenant_id, userId);
    return { ok: true };
  });

  app.get('/transactions', async (request) => {
    const userId = parseRequiredUserId(request.query);
    const type = parseOptionalEventType(request.query);
    return listEvents(request.server.ctx.db, request.tenant.tenant_id, userId, {
      type,
      limit: 100,
    });
  });
}
