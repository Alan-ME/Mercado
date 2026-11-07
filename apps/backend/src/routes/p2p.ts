import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  publishOrder,
  listOpenOrders,
  buyOrder,
  cancelPublication,
} from '../services/p2pService.js';

const publishSchema = z.object({
  couponId: z.string().uuid(),
  sellerId: z.string().min(1),
  askingPrice: z.number().positive(),
  requestedProductName: z.string().optional(),
});
const buySchema = z.object({ buyerId: z.string().min(1) });
const cancelSchema = z.object({ sellerId: z.string().min(1) });
const orderParams = z.object({ id: z.string().uuid() });

/**
 * Endpoints del mercado secundario P2P: publicación regulada, libro de órdenes,
 * compra atómica con split de comisiones y cancelación anticipada.
 */
export function registerP2PRoutes(app: FastifyInstance): void {
  // Publica una orden validando Price Collar, cuota diaria anti-bots y ventana de cierre.
  app.post('/p2p/orders', async (request, reply) => {
    const body = publishSchema.parse(request.body);
    const order = await publishOrder(request.server.ctx, request.tenant, body);
    reply.status(201);
    return order;
  });

  // Retorna el libro de ofertas activas segregado estrictamente por inquilino (tenant).
  app.get('/p2p/orders', async (request) => {
    return listOpenOrders(request.server.ctx, request.tenant);
  });

  // Ejecuta el match atómico: liquida comisiones, reasigna titular y rota tokenVersion.
  app.post('/p2p/orders/:id/buy', async (request) => {
    const { id } = orderParams.parse(request.params);
    const { buyerId } = buySchema.parse(request.body);
    return buyOrder(request.server.ctx, request.tenant, id, buyerId);
  });

  // Cancela la publicación, liberando el cupón y devolviéndolo al estado EN_WALLET.
  app.post('/p2p/orders/:id/cancel', async (request) => {
    const { id } = orderParams.parse(request.params);
    const { sellerId } = cancelSchema.parse(request.body);
    return cancelPublication(request.server.ctx, request.tenant, id, sellerId);
  });
}
