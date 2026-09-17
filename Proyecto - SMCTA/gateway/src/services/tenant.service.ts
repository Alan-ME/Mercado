import { getPostgresPool } from '../database/postgres';
import { getRedisClient } from '../database/redis';
import { config } from '../config';
import { TenantConfigDTO, TenantContext, TenantTheme } from '../types';

/**
 * Almacén en memoria de respaldo para desarrollo local/pruebas unitarias
 * con los datos oficiales de seed
 */
const FALLBACK_TENANTS: TenantContext[] = [
  {
    tenantId: '11111111-1111-1111-1111-111111111111',
    companyName: 'Festival Musical Vibe',
    subdomain: 'festival',
    sellerTakeRatePct: 3.50,
    buyerTakeRatePct: 2.50,
    priceFloorPct: 50.00,
    priceCeilingPct: 200.00,
    maxDailyResalesPerUser: 5,
    closureHoursBeforeEvent: 2,
    platformRevenueSharePct: 30.00,
    theme: {
      primaryColor: '#6B21A8',
      accentColor: '#EC4899',
      surfaceColor: '#0F172A',
      fontFamily: 'Outfit, sans-serif',
      logoUrl: '/assets/logos/festival.png'
    }
  },
  {
    tenantId: '22222222-2222-2222-2222-222222222222',
    companyName: 'Grand Hotel & Spa',
    subdomain: 'hotel',
    sellerTakeRatePct: 5.00,
    buyerTakeRatePct: 2.00,
    priceFloorPct: 70.00,
    priceCeilingPct: 150.00,
    maxDailyResalesPerUser: 5,
    closureHoursBeforeEvent: 2,
    platformRevenueSharePct: 30.00,
    theme: {
      primaryColor: '#065F46',
      accentColor: '#10B981',
      surfaceColor: '#F8FAFC',
      fontFamily: 'Inter, sans-serif',
      logoUrl: '/assets/logos/hotel.png'
    }
  }
];

export class TenantService {
  /**
   * Resuelve el Tenant buscando en:
   * 1. Caché L1 en Redis (si está conectado)
   * 2. Base de datos PostgreSQL
   * 3. Almacén en memoria de contingencia (fallback offline/tests)
   */
  public async resolveTenant(identifier: { subdomain?: string; tenantId?: string }): Promise<TenantContext | null> {
    const { subdomain, tenantId } = identifier;
    if (!subdomain && !tenantId) return null;

    // 1. Intento de recuperación desde Redis
    const cached = await this.getFromCache(subdomain, tenantId);
    if (cached) return cached;

    // 2. Consulta a PostgreSQL
    const fromDb = await this.getFromDatabase(subdomain, tenantId);
    if (fromDb) {
      await this.saveToCache(fromDb);
      return fromDb;
    }

    // 3. Contingencia / Fallback (si PostgreSQL no responde o para tests)
    const fallback = FALLBACK_TENANTS.find(t => 
      (subdomain && t.subdomain.toLowerCase() === subdomain.toLowerCase()) ||
      (tenantId && t.tenantId.toLowerCase() === tenantId.toLowerCase())
    );

    return fallback || null;
  }

  /**
   * Convierte el TenantContext al formato TenantConfigDTO oficial
   */
  public toDTO(tenant: TenantContext): TenantConfigDTO {
    return {
      tenantId: tenant.tenantId,
      companyName: tenant.companyName,
      subdomain: tenant.subdomain,
      sellerTakeRatePct: tenant.sellerTakeRatePct,
      buyerTakeRatePct: tenant.buyerTakeRatePct,
      priceFloorPct: tenant.priceFloorPct,
      priceCeilingPct: tenant.priceCeilingPct,
      maxDailyResalesPerUser: tenant.maxDailyResalesPerUser,
      closureHoursBeforeEvent: tenant.closureHoursBeforeEvent,
      platformRevenueSharePct: tenant.platformRevenueSharePct,
      theme: tenant.theme
    };
  }

  /**
   * Actualiza la configuración de un Tenant y refresca la caché (US-05)
   */
  public async updateTenantConfig(
    tenantId: string,
    updates: Partial<TenantConfigDTO>
  ): Promise<TenantContext> {
    const current = await this.resolveTenant({ tenantId });
    if (!current) {
      throw new Error(`Tenant con ID ${tenantId} no encontrado`);
    }

    const updated: TenantContext = {
      ...current,
      sellerTakeRatePct: updates.sellerTakeRatePct !== undefined ? updates.sellerTakeRatePct : current.sellerTakeRatePct,
      buyerTakeRatePct: updates.buyerTakeRatePct !== undefined ? updates.buyerTakeRatePct : current.buyerTakeRatePct,
      priceFloorPct: updates.priceFloorPct !== undefined ? updates.priceFloorPct : current.priceFloorPct,
      priceCeilingPct: updates.priceCeilingPct !== undefined ? updates.priceCeilingPct : current.priceCeilingPct,
      maxDailyResalesPerUser: updates.maxDailyResalesPerUser !== undefined ? updates.maxDailyResalesPerUser : current.maxDailyResalesPerUser,
      closureHoursBeforeEvent: updates.closureHoursBeforeEvent !== undefined ? updates.closureHoursBeforeEvent : current.closureHoursBeforeEvent,
      theme: {
        ...current.theme,
        ...(updates.theme || {})
      }
    };

    try {
      const pool = getPostgresPool();
      const query = `
        UPDATE tenants
        SET 
          seller_take_rate = $1,
          buyer_take_rate = $2,
          price_floor_pct = $3,
          price_ceiling_pct = $4,
          max_daily_resales_per_user = $5,
          closure_hours_before_event = $6,
          theme_config = $7::jsonb
        WHERE tenant_id::text = $8
      `;
      await pool.query(query, [
        updated.sellerTakeRatePct,
        updated.buyerTakeRatePct,
        updated.priceFloorPct,
        updated.priceCeilingPct,
        updated.maxDailyResalesPerUser,
        updated.closureHoursBeforeEvent,
        JSON.stringify(updated.theme),
        tenantId
      ]);
    } catch {
      // Modo resiliente si PostgreSQL no está conectado
    }

    const fallbackIdx = FALLBACK_TENANTS.findIndex(t => t.tenantId.toLowerCase() === tenantId.toLowerCase());
    if (fallbackIdx !== -1) {
      FALLBACK_TENANTS[fallbackIdx] = updated;
    }

    await this.saveToCache(updated);
    return updated;
  }

  private async getFromCache(subdomain?: string, tenantId?: string): Promise<TenantContext | null> {
    try {
      const redis = getRedisClient();
      if (!redis || redis.status !== 'ready') return null;

      const cacheKey = subdomain 
        ? `tenant:subdomain:${subdomain.toLowerCase()}` 
        : `tenant:id:${tenantId}`;

      const raw = await redis.get(cacheKey);
      if (!raw) return null;

      return JSON.parse(raw) as TenantContext;
    } catch {
      return null;
    }
  }

  private async saveToCache(tenant: TenantContext): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis || redis.status !== 'ready') return;

      const ttl = config.tenantCacheTtlSeconds;
      const serialized = JSON.stringify(tenant);

      await Promise.all([
        redis.setex(`tenant:subdomain:${tenant.subdomain.toLowerCase()}`, ttl, serialized),
        redis.setex(`tenant:id:${tenant.tenantId}`, ttl, serialized)
      ]);
    } catch {
      // Ignorar errores de escritura de caché
    }
  }

  private async getFromDatabase(subdomain?: string, tenantId?: string): Promise<TenantContext | null> {
    try {
      const pool = getPostgresPool();
      const query = `
        SELECT 
          tenant_id,
          company_name,
          subdomain,
          seller_take_rate,
          buyer_take_rate,
          price_floor_pct,
          price_ceiling_pct,
          max_daily_resales_per_user,
          closure_hours_before_event,
          platform_revenue_share_pct,
          theme_config
        FROM tenants 
        WHERE ($1::text IS NOT NULL AND LOWER(subdomain) = LOWER($1))
           OR ($2::text IS NOT NULL AND tenant_id::text = $2)
        LIMIT 1;
      `;

      const result = await pool.query(query, [subdomain || null, tenantId || null]);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      let parsedTheme: TenantTheme = {
        primaryColor: '#1A365D',
        accentColor: '#3182CE',
        surfaceColor: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
        logoUrl: ''
      };

      if (row.theme_config) {
        parsedTheme = typeof row.theme_config === 'string' 
          ? JSON.parse(row.theme_config) 
          : row.theme_config;
      }

      return {
        tenantId: row.tenant_id,
        companyName: row.company_name,
        subdomain: row.subdomain,
        sellerTakeRatePct: parseFloat(row.seller_take_rate),
        buyerTakeRatePct: parseFloat(row.buyer_take_rate),
        priceFloorPct: parseFloat(row.price_floor_pct),
        priceCeilingPct: parseFloat(row.price_ceiling_pct),
        maxDailyResalesPerUser: row.max_daily_resales_per_user || 5,
        closureHoursBeforeEvent: row.closure_hours_before_event || 2,
        platformRevenueSharePct: parseFloat(row.platform_revenue_share_pct || '30.00'),
        theme: parsedTheme
      };
    } catch {
      // Si la BD no está disponible o la tabla no existe aún, retorna null para ir a fallback
      return null;
    }
  }
}

export const tenantService = new TenantService();
