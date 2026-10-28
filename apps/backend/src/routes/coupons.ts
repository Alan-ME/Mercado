import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@smcta/shared';
import { getWallet, getQrToken } from '../services/walletService.js';

const walletQuery = z.object({ ownerId: z.string().min(1) });
const couponParams = z.object({ id: z.string().uuid() });

/** GET /api/v1/coupons/my-wallet, GET /api/v1/coupons/:id/qr-token — US-01/US-02. */
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
    return getQrToken(request.server.ctx, request.tenant, id);
  });
}
