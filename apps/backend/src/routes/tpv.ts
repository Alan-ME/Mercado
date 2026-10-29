import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateQrAndRedeem } from '../services/tpvService.js';

const bodySchema = z.object({ token: z.string().min(1) });

// Terminal de Punto de Venta (admisión en puerta):
// Escanea y valida el QR presentado por el cliente. Si la firma, el tenant, el timestamp (<30s),
// la titularidad y la versión coinciden, transiciona a CANJEADO y libera el nominal al comercio.
export function registerTpvRoutes(app: FastifyInstance): void {
  app.post('/tpv/validate-qr', async (request) => {
    const { token } = bodySchema.parse(request.body);
    return validateQrAndRedeem(request.server.ctx, request.tenant, token);
  });
}
