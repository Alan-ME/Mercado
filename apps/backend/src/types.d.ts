import type { ServiceContext } from './services/context.js';
import type { TenantRow } from './repositories/mappers.js';

declare module 'fastify' {
  interface FastifyInstance {
    ctx: ServiceContext;
  }
  interface FastifyRequest {
    tenant: TenantRow;
  }
}
