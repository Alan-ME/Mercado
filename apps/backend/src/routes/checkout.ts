import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { checkoutPrimary } from '../services/checkoutService.js';

const bodySchema = z.object({
  productName: z.string().max(160).optional(),
  nominalPrice: z.number().positive(),
  buyerId: z.string().min(1),
  expirationDate: z.string().datetime().optional(),
  paymentToken: z.string().optional(),
});

/** POST /api/v1/checkout/primary — US-01 / TASK-001. */
export function registerCheckoutRoutes(app: FastifyInstance): void {
  app.post('/checkout/primary', async (request, reply) => {
    const body = bodySchema.parse(request.body);
    const coupon = await checkoutPrimary(request.server.ctx, request.tenant, body);
    reply.status(201);
    return coupon;
  });

  // Simulador de pasarela de pagos (PSP mock, Rol 3): confirma el pago y emite el cupón.
  app.post('/psp/pay', async (request, reply) => {
    const body = bodySchema.parse(request.body);
    const coupon = await checkoutPrimary(request.server.ctx, request.tenant, body);
    reply.status(201);
    return { psp: 'MOCK_PAYMENT_CONFIRMED', coupon };
  });
}
