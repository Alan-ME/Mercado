import { randomUUID } from 'node:crypto';
import type { Database } from './database.js';
import { moneyStr } from '@smcta/shared';

/**
 * Datos de demostración multi-tenant. Los subdominios `festival` y `hotel` son los
 * que exige la prueba QA-04 (aislamiento). Cada tenant trae tema White-Label,
 * parámetros de negocio propios, usuarios demo y cupones EN_WALLET con su asiento
 * CHECKOUT (para que la auditoría de escrow cuadre en 0 desde el arranque).
 */

interface SeedTenant {
  subdomain: string;
  companyName: string;
  sellerTakeRate: number;
  buyerTakeRate: number;
  priceFloorPct: number;
  priceCeilingPct: number;
  maxResales: number;
  closureHours: number;
  platformShare: number;
  primary: string;
  accent: string;
  surface: string;
  font: string;
  users: string[];
  coupons: { product: string; nominal: number; ownerIndex: number; daysToExpire: number }[];
}

const TENANTS: SeedTenant[] = [
  {
    subdomain: 'festival',
    companyName: 'Ticketera Festival Live',
    sellerTakeRate: 3.0,
    buyerTakeRate: 2.0,
    priceFloorPct: 70,
    priceCeilingPct: 250,
    maxResales: 5,
    closureHours: 2,
    platformShare: 30,
    primary: '#6D28D9',
    accent: '#F59E0B',
    surface: '#FFFFFF',
    font: 'Inter, sans-serif',
    users: ['Ana (Pragmática)', 'Beto (Trader)', 'Caro (Tardía)'],
    coupons: [
      { product: 'Entrada VIP - Cosmic Fest', nominal: 100, ownerIndex: 0, daysToExpire: 14 },
      { product: 'Entrada General - Cosmic Fest', nominal: 60, ownerIndex: 1, daysToExpire: 14 },
    ],
  },
  {
    subdomain: 'hotel',
    companyName: 'Escapadas Premium Hotels',
    sellerTakeRate: 2.5,
    buyerTakeRate: 1.5,
    priceFloorPct: 60,
    priceCeilingPct: 180,
    maxResales: 5,
    closureHours: 72,
    platformShare: 30,
    primary: '#0F766E',
    accent: '#F97316',
    surface: '#FFFFFF',
    font: 'Inter, sans-serif',
    users: ['Diego', 'Emma'],
    coupons: [
      { product: 'Suite Fin de Semana - Bariloche', nominal: 300, ownerIndex: 0, daysToExpire: 20 },
    ],
  },
  {
    subdomain: 'sneakers',
    companyName: 'Urban Fashion Drops',
    sellerTakeRate: 3.5,
    buyerTakeRate: 2.5,
    priceFloorPct: 80,
    priceCeilingPct: 300,
    maxResales: 5,
    closureHours: 24,
    platformShare: 30,
    primary: '#111827',
    accent: '#10B981',
    surface: '#FFFFFF',
    font: 'Inter, sans-serif',
    users: ['Fabio', 'Gina'],
    coupons: [
      { product: 'Drop Air Limited - Par #042', nominal: 200, ownerIndex: 0, daysToExpire: 10 },
    ],
  },
];

export interface SeedResult {
  tenants: {
    tenantId: string;
    subdomain: string;
    companyName: string;
    users: { userId: string; displayName: string }[];
  }[];
}

export async function seedDatabase(db: Database): Promise<SeedResult> {
  const result: SeedResult = { tenants: [] };

  for (const t of TENANTS) {
    const tenantId = randomUUID();
    await db.query(
      `INSERT INTO tenants (tenant_id, company_name, subdomain, seller_take_rate, buyer_take_rate,
         price_floor_pct, price_ceiling_pct, max_daily_resales_per_user, closure_hours_before_event,
         platform_revenue_share_pct, qr_secret, theme_primary_color, theme_accent_color,
         theme_surface_color, theme_font_family, theme_logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        tenantId, t.companyName, t.subdomain, t.sellerTakeRate, t.buyerTakeRate,
        t.priceFloorPct, t.priceCeilingPct, t.maxResales, t.closureHours,
        t.platformShare, randomUUID(), t.primary, t.accent, t.surface, t.font, '',
      ],
    );

    const users: { userId: string; displayName: string }[] = [];
    for (const name of t.users) {
      const userId = randomUUID();
      await db.query(
        `INSERT INTO users (user_id, tenant_id, display_name, email, balance)
         VALUES ($1,$2,$3,$4,$5)`,
        [userId, tenantId, name, `${name.split(' ')[0]!.toLowerCase()}@${t.subdomain}.demo`, moneyStr(1000)],
      );
      users.push({ userId, displayName: name });
    }

    for (const c of t.coupons) {
      const couponId = randomUUID();
      const expiration = new Date(Date.now() + c.daysToExpire * 24 * 60 * 60 * 1000);
      const owner = users[c.ownerIndex]!;
      await db.query(
        `INSERT INTO coupons (coupon_id, tenant_id, current_owner_id, nominal_price, state, expiration_date, product_name)
         VALUES ($1,$2,$3,$4,'EN_WALLET',$5,$6)`,
        [couponId, tenantId, owner.userId, moneyStr(c.nominal), expiration.toISOString(), c.product],
      );
      await db.query(
        `INSERT INTO escrow_ledgers (tenant_id, coupon_id, transaction_type, amount_in_escrow)
         VALUES ($1,$2,'CHECKOUT',$3)`,
        [tenantId, couponId, moneyStr(c.nominal)],
      );
    }

    result.tenants.push({ tenantId, subdomain: t.subdomain, companyName: t.companyName, users });
  }

  return result;
}
