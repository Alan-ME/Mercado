import { Database } from './db.js';
import { TenantConfig } from '../../domain/entities/index.js';

export class TenantRepository {
  public static async findByIdOrSubdomain(identifier: string): Promise<TenantConfig | null> {
    const sql = `
      SELECT 
        tenant_id AS "tenantId",
        company_name AS "companyName",
        subdomain,
        seller_take_rate AS "sellerTakeRatePct",
        buyer_take_rate AS "buyerTakeRatePct",
        price_floor_pct AS "priceFloorPct",
        price_ceiling_pct AS "priceCeilingPct",
        max_daily_resales_per_user AS "maxDailyResalesPerUser",
        closure_hours_before_event AS "closureHoursBeforeEvent",
        platform_revenue_share_pct AS "platformRevenueSharePct",
        theme_config AS "themeConfig",
        created_at AS "createdAt"
      FROM tenants
      WHERE tenant_id::text = $1 OR subdomain = $1
      LIMIT 1;
    `;

    const res = await Database.query<TenantConfig>(sql, [identifier]);
    return res.rows[0] || null;
  }
}
