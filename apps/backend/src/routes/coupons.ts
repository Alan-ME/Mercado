import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@smcta/shared';
import { getWallet, getQrToken } from '../services/walletService.js';

const walletQuery = z.object({ ownerId: z.string().min(1) });
const qrQuery = z.object({ ownerId: z.string().min(1).optional() });
const couponParams = z.object({ id: z.string().uuid() });

function resolveRequesterId(request: FastifyRequest): string | undefined {
  const headerUser = (request.headers['x-user-id'] as string | undefined)?.trim();
  if (headerUser) return headerUser;
  const parsed = qrQuery.safeParse(request.query);
  return parsed.success ? parsed.data.ownerId : undefined;
}

export function registerCouponRoutes(app: FastifyInstance): void {
  app.get('/coupons/my-wallet', async (request) => {
    const q = walletQuery.safeParse(request.query);
    if (!q.success) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Parámetro ownerId requerido (?ownerId=...).');
    }
    return getWallet(request.server.ctx, request.tenant, q.data.ownerId);
  });

  app.get('/coupons/:id/qr-token', async (request) => {
    const { id } = couponParams.parse(request.params);
    const requesterId = resolveRequesterId(request);
    return getQrToken(request.server.ctx, request.tenant, id, requesterId);
  });
}
