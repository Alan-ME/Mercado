import type { FastifyInstance } from 'fastify';
import type { ServiceContext } from '../services/context.js';

/**
 * Rutas de apoyo para la demo (no forman parte del contrato de negocio).
 * Como el proyecto no incluye módulo de autenticación real, exponen los usuarios
 * y tenants sembrados para poder elegir "conectado como" en la UI.
 */

/** Tenant-scoped: usuarios demo del tenant actual. */
export function registerDevUserRoutes(app: FastifyInstance): void {
  app.get('/dev/users', async (request) => {
    const { rows } = await request.server.ctx.db.query<{
      user_id: string;
      display_name: string;
      email: string;
    }>(
      `SELECT user_id, display_name, email FROM users
       WHERE tenant_id = $1 ORDER BY created_at ASC`,
      [request.tenant.tenant_id],
    );
    return rows.map((r) => ({ userId: r.user_id, displayName: r.display_name, email: r.email }));
  });

  // Cupones EN_WALLET del tenant (para el "modo demo" del TPV sin cámara física).
  app.get('/dev/coupons', async (request) => {
    const { rows } = await request.server.ctx.db.query<{
      coupon_id: string;
      product_name: string;
      current_owner_id: string;
    }>(
      `SELECT coupon_id, product_name, current_owner_id FROM coupons
       WHERE tenant_id = $1 AND state = 'EN_WALLET' ORDER BY created_at DESC`,
      [request.tenant.tenant_id],
    );
    return rows.map((r) => ({
      couponId: r.coupon_id,
      productName: r.product_name,
      ownerId: r.current_owner_id,
    }));
  });
}

/** Público: catálogo de tenants sembrados (para el selector de instancia White-Label). */
export function registerPublicTenantList(app: FastifyInstance, ctx: ServiceContext): void {
  app.get('/api/v1/dev/tenants', async () => {
    const { rows } = await ctx.db.query<{
      tenant_id: string;
      subdomain: string;
      company_name: string;
      theme_primary_color: string;
      theme_accent_color: string;
    }>(
      `SELECT tenant_id, subdomain, company_name, theme_primary_color, theme_accent_color
       FROM tenants ORDER BY company_name ASC`,
    );
    return rows.map((r) => ({
      tenantId: r.tenant_id,
      subdomain: r.subdomain,
      companyName: r.company_name,
      primaryColor: r.theme_primary_color,
      accentColor: r.theme_accent_color,
    }));
  });
}
