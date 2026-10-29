import type { FastifyInstance } from 'fastify';
import { tenantToConfigDTO } from '../repositories/mappers.js';

// Devuelve la configuración de negocio y tokens de diseño del tenant resuelto para la SPA White-Label.
export function registerTenantRoutes(app: FastifyInstance): void {
  app.get('/tenant/config', async (request) => {
    return tenantToConfigDTO(request.tenant);
  });
}
