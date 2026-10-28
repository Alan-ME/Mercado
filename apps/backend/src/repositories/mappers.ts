import {
  type CouponDTO,
  type P2POrderDTO,
  type TenantConfigDTO,
  CouponState,
  OrderSide,
  OrderStatus,
  computeCommission,
} from '@smcta/shared';

/** Convierte a número tanto strings (driver pg) como números (PGlite). */
export function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  return Number(v);
}

/** Convierte a ISO-8601 tanto Date como string. */
export function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return new Date(String(v)).toISOString();
}

export interface TenantRow {
  tenant_id: string;
  company_name: string;
  subdomain: string;
  seller_take_rate: string | number;
  buyer_take_rate: string | number;
  price_floor_pct: string | number;
  price_ceiling_pct: string | number;
  max_daily_resales_per_user: string | number;
  closure_hours_before_event: string | number;
  platform_revenue_share_pct: string | number;
  qr_secret: string;
  theme_primary_color: string;
  theme_accent_color: string;
  theme_surface_color: string;
  theme_font_family: string;
  theme_logo_url: string;
}

export function tenantToConfigDTO(r: TenantRow): TenantConfigDTO {
  return {
    tenantId: r.tenant_id,
    companyName: r.company_name,
    subdomain: r.subdomain,
    sellerTakeRatePct: toNum(r.seller_take_rate),
    buyerTakeRatePct: toNum(r.buyer_take_rate),
    priceFloorPct: toNum(r.price_floor_pct),
    priceCeilingPct: toNum(r.price_ceiling_pct),
    maxDailyResalesPerUser: toNum(r.max_daily_resales_per_user),
    closureHoursBeforeEvent: toNum(r.closure_hours_before_event),
    platformRevenueSharePct: toNum(r.platform_revenue_share_pct),
    theme: {
      primaryColor: r.theme_primary_color,
      accentColor: r.theme_accent_color,
      surfaceColor: r.theme_surface_color,
      fontFamily: r.theme_font_family,
      logoUrl: r.theme_logo_url,
    },
  };
}

export interface CouponRow {
  coupon_id: string;
  tenant_id: string;
  current_owner_id: string;
  nominal_price: string | number;
  state: CouponState;
  qr_encrypted_token: string;
  expiration_date: string | Date;
  product_name: string;
  token_version: string | number;
  created_at: string | Date;
}

export function couponToDTO(r: CouponRow): CouponDTO {
  return {
    couponId: r.coupon_id,
    tenantId: r.tenant_id,
    currentOwnerId: r.current_owner_id,
    nominalPrice: toNum(r.nominal_price),
    state: r.state,
    qrEncryptedToken: r.qr_encrypted_token,
    expirationDate: toIso(r.expiration_date),
    createdAt: toIso(r.created_at),
  };
}

export interface OrderRow {
  order_id: string;
  tenant_id: string;
  coupon_id: string;
  seller_id: string;
  asking_price: string | number;
  side: OrderSide;
  status: OrderStatus;
  buyer_id: string | null;
  created_at: string | Date;
}

export function orderToDTO(
  r: OrderRow,
  nominalPrice: number,
  sellerTakeRatePct: number,
  buyerTakeRatePct: number,
): P2POrderDTO {
  return {
    orderId: r.order_id,
    tenantId: r.tenant_id,
    couponId: r.coupon_id,
    sellerId: r.seller_id,
    askingPrice: toNum(r.asking_price),
    side: r.side,
    status: r.status,
    createdAt: toIso(r.created_at),
    commissionBreakdown: computeCommission({
      nominalPrice,
      askingPrice: toNum(r.asking_price),
      sellerTakeRatePct,
      buyerTakeRatePct,
    }),
  };
}
