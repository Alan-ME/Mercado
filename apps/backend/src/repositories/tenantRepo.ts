import type { Queryable } from '../db/database.js';
import { hydrateTenantRow, type RawTenantRow, type TenantRow } from './mappers.js';

const COLS = `tenant_id, company_name, subdomain, seller_take_rate, buyer_take_rate,
  price_floor_pct, price_ceiling_pct, max_daily_resales_per_user, closure_hours_before_event,
  platform_revenue_share_pct, qr_secret, theme_primary_color, theme_accent_color,
  theme_surface_color, theme_font_family, theme_logo_url`;

export async function findTenantBySubdomain(
  db: Queryable,
  subdomain: string,
): Promise<TenantRow | null> {
  const { rows } = await db.query<RawTenantRow>(
    `SELECT ${COLS} FROM tenants WHERE subdomain = $1`,
    [subdomain],
  );
  return rows[0] ? hydrateTenantRow(rows[0]) : null;
}

export async function findTenantById(
  db: Queryable,
  tenantId: string,
): Promise<TenantRow | null> {
  const { rows } = await db.query<RawTenantRow>(
    `SELECT ${COLS} FROM tenants WHERE tenant_id = $1`,
    [tenantId],
  );
  return rows[0] ? hydrateTenantRow(rows[0]) : null;
}

export interface TenantConfigPatch {
  sellerTakeRatePct?: number;
  buyerTakeRatePct?: number;
  priceFloorPct?: number;
  priceCeilingPct?: number;
  maxDailyResalesPerUser?: number;
  closureHoursBeforeEvent?: number;
  platformRevenueSharePct?: number;
  themePrimaryColor?: string;
  themeAccentColor?: string;
  themeSurfaceColor?: string;
  themeFontFamily?: string;
  themeLogoUrl?: string;
}

const PATCH_COLUMN: Record<keyof TenantConfigPatch, string> = {
  sellerTakeRatePct: 'seller_take_rate',
  buyerTakeRatePct: 'buyer_take_rate',
  priceFloorPct: 'price_floor_pct',
  priceCeilingPct: 'price_ceiling_pct',
  maxDailyResalesPerUser: 'max_daily_resales_per_user',
  closureHoursBeforeEvent: 'closure_hours_before_event',
  platformRevenueSharePct: 'platform_revenue_share_pct',
  themePrimaryColor: 'theme_primary_color',
  themeAccentColor: 'theme_accent_color',
  themeSurfaceColor: 'theme_surface_color',
  themeFontFamily: 'theme_font_family',
  themeLogoUrl: 'theme_logo_url',
};

export async function updateTenantConfig(
  db: Queryable,
  tenantId: string,
  patch: TenantConfigPatch,
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    sets.push(`${PATCH_COLUMN[key as keyof TenantConfigPatch]} = $${i++}`);
    params.push(value);
  }
  if (sets.length === 0) return;
  params.push(tenantId);
  await db.query(`UPDATE tenants SET ${sets.join(', ')} WHERE tenant_id = $${i}`, params);
}
