import { Response, NextFunction } from 'express';
import { AuthenticatedTenantRequest, ApiErrorResponse } from '../types';
import { tenantService } from '../services/tenant.service';

/**
 * Middleware de Resolución Multi-Tenant
 * Extrae el contexto del inquilino a partir del subdominio de Host o de la cabecera x-tenant-id.
 * Cumple con TASK-007 y especificación de arquitectura.
 */
export async function tenantResolverMiddleware(
  req: AuthenticatedTenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Rutas exentas de validación de Tenant (Healthcheck e información del sistema)
  if (req.path === '/health' || req.path === '/favicon.ico') {
    return next();
  }

  try {
    const rawHost = (req.headers.host || '').trim();
    const hostname = rawHost.split(':')[0]; // Elimina el puerto si existe
    const tenantHeader = (req.headers['x-tenant-id'] as string || '').trim();

    let extractedSubdomain: string | undefined = undefined;

    // Si el host tiene formato con subdominio (ej: festival.smcta.local o festival.smcta.com)
    const hostParts = hostname.split('.');
    if (hostParts.length >= 2 && !hostname.startsWith('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const candidate = hostParts[0].toLowerCase();
      if (candidate !== 'www' && candidate !== 'api' && candidate !== 'app') {
        extractedSubdomain = candidate;
      }
    }

    // Resolución: Prioridad a subdominio, luego a cabecera x-tenant-id
    const tenant = await tenantService.resolveTenant({
      subdomain: extractedSubdomain,
      tenantId: tenantHeader || undefined,
    });

    if (!tenant) {
      const errorPayload: ApiErrorResponse = {
        errorCode: 'TENANT_NOT_FOUND',
        message: 'Subdominio o Tenant ID no registrado en la plataforma SMCTA.',
        details: {
          host: rawHost,
          extractedSubdomain: extractedSubdomain || null,
          tenantHeader: tenantHeader || null,
        },
      };
      res.status(404).json(errorPayload);
      return;
    }

    // Inyección de contexto en la petición
    req.tenant = tenant;

    // Propagación hacia servicios downstream
    req.headers['x-tenant-id'] = tenant.tenantId;

    next();
  } catch (error) {
    const errorPayload: ApiErrorResponse = {
      errorCode: 'TENANT_RESOLUTION_ERROR',
      message: 'Fallo interno al resolver el contexto multi-tenant.',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    res.status(500).json(errorPayload);
  }
}
