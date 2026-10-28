/**
 * Contratos de datos compartidos (única fuente de verdad técnica).
 * Transcritos de: 05_Fase_Gestion_de_Proyecto_y_Roadmap/Hojas_de_Ruta_Distribuidas/
 *                 00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md §2
 *
 * Los nombres de campos, tipos y enumerados son INMUTABLES: backend (Rol 1),
 * frontend (Rol 2) y gateway/QA (Rol 3) dependen de estas estructuras.
 */

// ==========================================
// ENUMERADOS DEL SISTEMA
// ==========================================

/** Máquina de estados del cupón (REQ-002 §1). */
export enum CouponState {
  EMITIDO = 'EMITIDO',
  EN_WALLET = 'EN_WALLET',
  PUBLICADO_P2P = 'PUBLICADO_P2P',
  CANJEADO = 'CANJEADO',
  VENCIDO = 'VENCIDO',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  CANCELLED = 'CANCELLED',
}

export enum LedgerTransactionType {
  CHECKOUT = 'CHECKOUT',
  P2P_SPLIT = 'P2P_SPLIT',
  REDEEM_RELEASE = 'REDEEM_RELEASE',
  REFUND = 'REFUND',
}

// ==========================================
// DTOs Y ENTIDADES MAESTRAS
// ==========================================

export interface TenantTheme {
  primaryColor: string; // Ej: "#1A365D"
  accentColor: string; // Ej: "#3182CE"
  surfaceColor: string; // Ej: "#FFFFFF"
  fontFamily: string; // Ej: "Inter, sans-serif"
  logoUrl: string;
}

export interface TenantConfigDTO {
  tenantId: string;
  companyName: string;
  subdomain: string;
  sellerTakeRatePct: number; // Ej: 3.50 (%)
  buyerTakeRatePct: number; // Ej: 2.50 (%)
  priceFloorPct: number; // Ej: 50.00 (% del nominal)
  priceCeilingPct: number; // Ej: 200.00 (% del nominal)
  maxDailyResalesPerUser: number; // Ej: 5
  closureHoursBeforeEvent: number; // Ej: 2 (horas antes para cerrar P2P)
  platformRevenueSharePct: number; // Ej: 30.00 (%)
  theme: TenantTheme;
}

export interface CouponDTO {
  couponId: string;
  tenantId: string;
  currentOwnerId: string;
  nominalPrice: number; // Ej: 100.00
  state: CouponState;
  qrEncryptedToken: string; // Token criptográfico rotativo
  expirationDate: string; // ISO-8601
  createdAt: string;
}

export interface CommissionBreakdown {
  nominalPrice: number;
  askingPrice: number;
  sellerFeePct: number;
  sellerFeeAmount: number; // askingPrice * (sellerTakeRate / 100)
  netSellerProceeds: number; // askingPrice - sellerFeeAmount
  buyerFeePct: number;
  buyerFeeAmount: number; // askingPrice * (buyerTakeRate / 100)
  totalBuyerPrice: number; // askingPrice + buyerFeeAmount
}

export interface P2POrderDTO {
  orderId: string;
  tenantId: string;
  couponId: string;
  sellerId: string;
  askingPrice: number; // Precio de reventa propuesto
  side: OrderSide;
  status: OrderStatus;
  createdAt: string;
  commissionBreakdown: CommissionBreakdown;
}

export interface QRTokenPayload {
  couponId: string;
  tenantId: string;
  ownerId: string;
  nonce: string; // Generado aleatoriamente cada 30 segundos
  timestamp: number; // Epoch millis
  signature: string; // HMAC-SHA256 firmado con clave secreta del tenant
  tokenVersion?: number; // Invalida QRs viejos incluso si el cupón vuelve al dueño original (A->B->A)
}

// ==========================================
// PAYLOADS DE PETICIÓN (request bodies)
// ==========================================

export interface CheckoutPrimaryRequest {
  productName?: string; // producto/plantilla elegido en la tienda
  nominalPrice: number;
  buyerId: string; // usuario autenticado que compra la emisión primaria
  expirationDate?: string; // ISO-8601 (fecha del evento / caducidad); default +30d
  paymentToken?: string; // token de la pasarela (PSP mock); 'fail' fuerza rechazo
}

export interface PublishOrderRequest {
  couponId: string;
  sellerId: string;
  askingPrice: number;
}

export interface BuyOrderRequest {
  buyerId: string;
}

export interface ValidateQrRequest {
  token: string; // QR firmado escaneado en el TPV
}

/** Formato estándar de error de negocio (Protocolo §4). */
export interface ApiErrorBody {
  errorCode: string;
  message: string;
  details: Record<string, unknown>;
}
