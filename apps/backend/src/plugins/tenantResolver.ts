import type { FastifyRequest } from 'fastify';
import { AppError, ErrorCode } from '@smcta/shared';
import type { ServiceContext } from '../services/context.js';
import { findTenantBySubdomain, findTenantById } from '../repositories/tenantRepo.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * TASK-007: resuelve el contexto B2B (tenant) por subdominio o cabecera x-tenant-id.
 *
 * Orden de resolución:
 *  1. Header `x-tenant-id`: acepta el UUID del tenant O su subdominio
 *     (conveniencia para apps móviles y desarrollo local, como indica el doc).
 *  2. Subdominio del Host (ej. `festival.smcta.local` => `festival`).
 *
 * Si no resuelve => TENANT_NOT_FOUND (HTTP 404). Inyecta req.tenant.
 */
export async function resolveTenant(
  ctx: ServiceContext,
  request: FastifyRequest,
): Promise<void> {
  const header = (request.headers['x-tenant-id'] as string | undefined)?.trim();
  const host = (request.headers.host ?? '').split(':')[0] ?? '';
  const subdomainFromHost = host.split('.')[0] ?? '';

  let tenant = null;

  if (header) {
    tenant = UUID_RE.test(header)
      ? await findTenantById(ctx.db, header)
      : await findTenantBySubdomain(ctx.db, header);
  }

  if (!tenant && subdomainFromHost && subdomainFromHost !== 'localhost') {
    tenant = await findTenantBySubdomain(ctx.db, subdomainFromHost);
  }

  if (!tenant) {
    throw new AppError(
      ErrorCode.TENANT_NOT_FOUND,
      'Tenant B2B no encontrado o inactivo. Enviá el subdominio o la cabecera x-tenant-id.',
      { hostSubdomain: subdomainFromHost, header: header ?? null },
    );
  }

  request.tenant = tenant;
}
