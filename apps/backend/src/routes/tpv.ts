import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateQrAndRedeem } from '../services/tpvService.js';

const bodySchema = z.object({ token: z.string().min(1) });

/** POST /api/v1/tpv/validate-qr — US-06 / TASK-008. */
export function registerTpvRoutes(app: FastifyInstance): void {
  app.post('/tpv/validate-qr', async (request) => {
    const { token } = bodySchema.parse(request.body);
    return validateQrAndRedeem(request.server.ctx, request.tenant, token);
  });
}
