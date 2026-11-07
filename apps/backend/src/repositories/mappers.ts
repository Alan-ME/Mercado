import {
  type CouponDTO,
  type P2POrderDTO,
  type TenantConfigDTO,
  CouponState,
  OrderSide,
  OrderStatus,
  computeCommission,
} from '@smcta/shared';
import { QrSecret } from '../domain/qrSecret.js';

// Postgres devuelve los tipos NUMERIC/DECIMAL como strings (ej. "100.00") para evitar
// que el parseador de JSON o el driver pierdan precisión IEEE-754.
export function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  return Number(v);
}

// Estandariza timestamps: node-pg devuelve Date, pero PGlite o mocks pueden mandar strings.
export function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return new Date(String(v)).toISOString();
}

export interface RawTenantRow {
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
  discontinued_incentive_pct?: string | number;
  gold_rate_per_unit?: string | number;
  qr_secret: string;
  theme_primary_color: string;
  theme_accent_color: string;
  theme_surface_color: string;
  theme_font_family: string;
  theme_logo_url: string;
}

export interface TenantRow extends Omit<RawTenantRow, 'qr_secret'> {
  qr_secret: QrSecret;
}

// Encapsula qr_secret en un Value Object inmutable y no-enumerable para que ningún console.log
// o serializador JSON filtre la clave criptográfica en los logs del servidor.
export function hydrateTenantRow(raw: RawTenantRow): TenantRow {
  return {
    ...raw,
    qr_secret: QrSecret.fromRaw(raw.qr_secret),
  };
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
  is_discontinued?: boolean;
  pending_reward_credits?: string | number;
  reward_recipient_id?: string | null;
  reward_claimed?: boolean;
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
  product_name?: string;
  requested_product_name?: string;
  reward_credits_offered?: string | number;
  side: OrderSide;
  status: OrderStatus;
  buyer_id: string | null;
  created_at: string | Date;
}

export interface OrderWithNominalRow extends OrderRow {
  nominal_price: string | number;
  product_name: string;
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
    productName: r.product_name ?? '',
    requestedProductName: r.requested_product_name ?? '',
    rewardCreditsOffered: toNum(r.reward_credits_offered ?? 0),
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
