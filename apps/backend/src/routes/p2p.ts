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
});
const buySchema = z.object({ buyerId: z.string().min(1) });
const cancelSchema = z.object({ sellerId: z.string().min(1) });
const orderParams = z.object({ id: z.string().uuid() });

/** Endpoints del mercado P2P — US-03/US-04, TASK-004/005/006. */
export function registerP2PRoutes(app: FastifyInstance): void {
  // POST /api/v1/p2p/orders — publicar (Price Collar, límite diario, ventana).
  app.post('/p2p/orders', async (request, reply) => {
    const body = publishSchema.parse(request.body);
    const order = await publishOrder(request.server.ctx, request.tenant, body);
    reply.status(201);
    return order;
  });

  // GET /api/v1/p2p/orders — libro de órdenes abiertas (filtrado por tenant).
  app.get('/p2p/orders', async (request) => {
    return listOpenOrders(request.server.ctx, request.tenant);
  });

  // POST /api/v1/p2p/orders/:id/buy — match atómico + split de comisiones.
  app.post('/p2p/orders/:id/buy', async (request) => {
    const { id } = orderParams.parse(request.params);
    const { buyerId } = buySchema.parse(request.body);
    return buyOrder(request.server.ctx, request.tenant, id, buyerId);
  });

  // POST /api/v1/p2p/orders/:id/cancel — RN-01: devuelve el cupón a EN_WALLET.
  app.post('/p2p/orders/:id/cancel', async (request) => {
    const { id } = orderParams.parse(request.params);
    const { sellerId } = cancelSchema.parse(request.body);
    return cancelPublication(request.server.ctx, request.tenant, id, sellerId);
  });
}
