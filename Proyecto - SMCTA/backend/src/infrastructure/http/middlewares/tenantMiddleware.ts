import { Request, Response, NextFunction } from 'express';
import { TenantRepository } from '../../database/tenantRepository.js';
import { TenantConfig } from '../../../domain/entities/index.js';
import { TenantNotFoundError } from '../../../shared/errors.js';

declare global {
  namespace Express {
    interface Request {
      tenant: TenantConfig;
      userId?: string;
    }
  }
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const host = req.headers.host || '';
    const headerTenant = req.headers['x-tenant-id'] as string;
    const queryTenant = req.query.tenantId as string;

    const hostParts = host.split('.');
    const subdomain = hostParts.length > 2 || (hostParts.length === 2 && hostParts[1].startsWith('localhost'))
      ? hostParts[0]
      : null;

    const identifier = headerTenant || queryTenant || subdomain;

    if (!identifier) {
      throw new TenantNotFoundError('No se proporcionó identificador de Tenant (cabecera x-tenant-id o subdominio).');
    }

    const tenant = await TenantRepository.findByIdOrSubdomain(identifier);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant '${identifier}' no registrado o inactivo.`);
    }

    req.tenant = tenant;
    req.userId = (req.headers['x-user-id'] as string) || req.body?.userId;

    next();
  } catch (error) {
    next(error);
  }
};
