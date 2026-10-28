import type { FastifyInstance } from 'fastify';
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
const TYPES: UserEventType[] = [
  'PRIMARY_PURCHASE',
  'P2P_LISTED',
  'P2P_SALE',
  'P2P_BUY',
  'REDEEM',
  'P2P_CANCELLED',
];

/**
 * Feed de actividad por usuario:
 *  - GET  /notifications      centro de notificaciones (recientes + no leídas)
 *  - POST /notifications/read marca todas como leídas
 *  - GET  /transactions       historial completo con filtro por tipo (UX §1 / Tarea 2.8)
 */
export function registerActivityRoutes(app: FastifyInstance): void {
  app.get('/notifications', async (request) => {
    const q = userQuery.safeParse(request.query);
    if (!q.success) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Parámetro ownerId/userId requerido.');
    const t = request.tenant.tenant_id;
    const [events, unreadCount] = await Promise.all([
      listEvents(request.server.ctx.db, t, q.data.userId, { limit: 15 }),
      countUnread(request.server.ctx.db, t, q.data.userId),
    ]);
    return { unreadCount, events };
  });

  app.post('/notifications/read', async (request) => {
    const { userId } = readBody.parse(request.body);
    await markAllRead(request.server.ctx.db, request.tenant.tenant_id, userId);
    return { ok: true };
  });

  app.get('/transactions', async (request) => {
    const q = userQuery.safeParse(request.query);
    if (!q.success) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Parámetro userId requerido.');
    const typeRaw = (request.query as { type?: string }).type;
    const type = TYPES.includes(typeRaw as UserEventType) ? (typeRaw as UserEventType) : undefined;
    return listEvents(request.server.ctx.db, request.tenant.tenant_id, q.data.userId, {
      type,
      limit: 100,
    });
  });
}
