import type { FastifyRequest } from 'fastify';
import { AppError, ErrorCode } from '@smcta/shared';
import type { ServiceContext } from '../services/context.js';
import { findTenantBySubdomain, findTenantById } from '../repositories/tenantRepo.js';
import type { TenantRow } from '../repositories/mappers.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IPV4_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/;

// Truco sucio pero indispensable: si alguien levanta en local con 127.0.0.1:8080 y hacés un split('.')
// ingenuo, te queda subdomain = "127" y le tirás un SELECT a Postgres buscando una empresa que se llame 127.
// Filtramos localhost e IPs antes de intentar resolver por DNS.
function extractHostSubdomain(rawHost: string): string {
  const hostname = rawHost.split(':')[0]!.trim().toLowerCase();
  if (!hostname || hostname === 'localhost' || IPV4_RE.test(hostname)) return '';
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts[0]! : '';
}

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// Por qué permitimos ?tenant= por query param acá?
// Porque la API estándar de EventSource en el navegador NO permite mandar headers HTTP custom (como x-tenant-id).
// Podríamos haber metido un polyfill de 50KB con fetch-event-source, pero pasar el tenant por query en el SSE
// es infinitamente más limpio y estándar.
function readQueryTenant(query: unknown): string {
  if (!query || typeof query !== 'object') return '';
  return readTrimmedString((query as Record<string, unknown>).tenant);
}

async function lookupTenantByHint(ctx: ServiceContext, hint: string): Promise<TenantRow | null> {
  if (!hint) return null;
  if (UUID_RE.test(hint)) return findTenantById(ctx.db, hint);
  return findTenantBySubdomain(ctx.db, hint);
}

async function findFirstMatchingTenant(
  ctx: ServiceContext,
  hints: string[],
): Promise<TenantRow | null> {
  for (const hint of hints) {
    const found = await lookupTenantByHint(ctx, hint);
    if (found) return found;
  }
  return null;
}

// Orden de prioridad: x-tenant-id -> subdominio del Host -> query ?tenant= (necesario para EventSource SSE en navegador, que no deja mandar headers custom).
export async function resolveTenant(
  ctx: ServiceContext,
  request: FastifyRequest,
): Promise<void> {
  const headerHint = readTrimmedString(request.headers['x-tenant-id']);
  const hostHint = extractHostSubdomain(readTrimmedString(request.headers.host));
  const queryHint = readQueryTenant(request.query);

  const tenant = await findFirstMatchingTenant(ctx, [headerHint, hostHint, queryHint]);
  if (!tenant) {
    throw new AppError(
      ErrorCode.TENANT_NOT_FOUND,
      'Tenant B2B no encontrado o inactivo. Enviá el subdominio o la cabecera x-tenant-id.',
      { hostSubdomain: hostHint, header: headerHint },
    );
  }

  request.tenant = tenant;
}
