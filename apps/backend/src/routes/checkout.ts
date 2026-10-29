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

// Emisión primaria: procesa el cobro al comprador inicial, genera el cupón cifrado y deposita el nominal en Escrow.
export function registerCheckoutRoutes(app: FastifyInstance): void {
  app.post('/checkout/primary', async (request, reply) => {
    const body = bodySchema.parse(request.body);
    const coupon = await checkoutPrimary(request.server.ctx, request.tenant, body);
    reply.status(201);
    return coupon;
  });

  // Simulador de pasarela de pagos (PSP mock): emula la confirmación asíncrona de cobro con tarjeta
  // para no depender de credenciales reales de Stripe o Mercado Pago en la demo de cátedra.
  app.post('/psp/pay', async (request, reply) => {
    const body = bodySchema.parse(request.body);
    const coupon = await checkoutPrimary(request.server.ctx, request.tenant, body);
    reply.status(201);
    return { psp: 'MOCK_PAYMENT_CONFIRMED', coupon };
  });
}
