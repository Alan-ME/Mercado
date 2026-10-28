import type { FastifyInstance } from 'fastify';
import { tenantToConfigDTO } from '../repositories/mappers.js';

/** GET /api/v1/tenant/config — resuelve config + tema visual del tenant (Protocolo §3). */
export function registerTenantRoutes(app: FastifyInstance): void {
  app.get('/tenant/config', async (request) => {
    return tenantToConfigDTO(request.tenant);
  });
}
