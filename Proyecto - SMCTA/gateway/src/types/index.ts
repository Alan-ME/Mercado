import { Request } from 'express';

/**
 * Esquema de tema visual del Tenant (White-Label)
 */
export interface TenantTheme {
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
  logoUrl: string;
}

/**
 * DTO Oficial de Configuración de Tenant
 * Fuente: 00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md
 */
export interface TenantConfigDTO {
  tenantId: string;
  companyName: string;
  subdomain: string;
  sellerTakeRatePct: number;      // Ej: 3.50 (%)
  buyerTakeRatePct: number;       // Ej: 2.50 (%)
  priceFloorPct: number;          // Ej: 50.00 (% del nominal)
  priceCeilingPct: number;        // Ej: 200.00 (% del nominal)
  maxDailyResalesPerUser: number; // Ej: 5
  closureHoursBeforeEvent: number;// Ej: 2 (horas antes para cerrar P2P)
  platformRevenueSharePct: number;// Ej: 30.00 (%)
  theme: TenantTheme;
}

/**
 * Entidad interna de Tenant recuperada de PostgreSQL / Redis
 */
export interface TenantEntity {
  tenant_id: string;
  company_name: string;
  subdomain: string;
  seller_take_rate: number | string;
  buyer_take_rate: number | string;
  price_floor_pct: number | string;
  price_ceiling_pct: number | string;
  max_daily_resales_per_user?: number;
  closure_hours_before_event?: number;
  platform_revenue_share_pct?: number | string;
  theme_config?: TenantTheme | string;
  created_at?: Date | string;
}

/**
 * Contexto inyectado en la petición para el ciclo de vida Express
 */
export interface TenantContext {
  tenantId: string;
  companyName: string;
  subdomain: string;
  sellerTakeRatePct: number;
  buyerTakeRatePct: number;
  priceFloorPct: number;
  priceCeilingPct: number;
  maxDailyResalesPerUser: number;
  closureHoursBeforeEvent: number;
  platformRevenueSharePct: number;
  theme: TenantTheme;
}

/**
 * Estructura estándar de error JSON inmutable según el protocolo
 */
export interface ApiErrorResponse {
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Extensión de la interfaz Request de Express para incluir req.tenant
 */
export interface AuthenticatedTenantRequest extends Request {
  tenant?: TenantContext;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}
