// Contratos de datos compartidos entre backend y frontend (monorepo unificado).
// Los nombres de campos, tipos y enumerados son intocables: cualquier renombramiento
// silencioso rompe la serialización JSON del protocolo P2P, los clientes móviles
// y la firma criptográfica HMAC de los tokens QR.

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

export interface TenantTheme {
  primaryColor: string; // HEX #RRGGBB o #RGB para la marca del comercio
  accentColor: string; // Color de acción / contraste para botones y pills
  surfaceColor: string; // Fondo de tarjetas y paneles
  fontFamily: string; // Fuente corporativa
  logoUrl: string;
}

export interface TenantConfigDTO {
  tenantId: string;
  companyName: string;
  subdomain: string;
  sellerTakeRatePct: number; // Porcentaje cobrado al vendedor (ej. 3.50 = 3.5%)
  buyerTakeRatePct: number; // Porcentaje cobrado al comprador (ej. 2.50 = 2.5%)
  priceFloorPct: number; // Porcentaje mínimo del nominal permitido en reventa (ej. 50 = 50%)
  priceCeilingPct: number; // Porcentaje máximo del nominal permitido en reventa (ej. 200 = 200%)
  maxDailyResalesPerUser: number; // Límite de reventas por usuario en 24h para frenar scalpers y bots
  closureHoursBeforeEvent: number; // Horas previas al evento donde se congela el P2P para evitar fraudes en puerta
  platformRevenueSharePct: number; // Tajada de SMCTA Core sobre las comisiones totales
  theme: TenantTheme;
}

export interface CouponDTO {
  couponId: string;
  tenantId: string;
  currentOwnerId: string;
  nominalPrice: number; // Importe nominal emitido en custodia
  state: CouponState;
  qrEncryptedToken: string; // Token firmado rotativo de 30s
  expirationDate: string; // ISO-8601 UTC
  createdAt: string;
}

export interface CommissionBreakdown {
  nominalPrice: number;
  askingPrice: number;
  sellerFeePct: number;
  sellerFeeAmount: number; // askingPrice * (sellerTakeRate / 100)
  netSellerProceeds: number; // askingPrice - sellerFeeAmount (lo que cobra el vendedor)
  buyerFeePct: number;
  buyerFeeAmount: number; // askingPrice * (buyerTakeRate / 100)
  totalBuyerPrice: number; // askingPrice + buyerFeeAmount (lo que paga el comprador)
}

export interface P2POrderDTO {
  orderId: string;
  tenantId: string;
  couponId: string;
  sellerId: string;
  askingPrice: number;
  productName?: string;
  requestedProductName?: string;
  rewardCreditsOffered?: number;
  side: OrderSide;
  status: OrderStatus;
  createdAt: string;
  commissionBreakdown: CommissionBreakdown;
}

export interface QRTokenPayload {
  couponId: string;
  tenantId: string;
  ownerId: string;
  nonce: string; // Sal aleatoria generada en cada rotación para evitar colisiones
  timestamp: number; // Epoch millis del momento de emisión
  signature: string; // HMAC-SHA256 firmado con el secreto interno del tenant
  tokenVersion?: number; // Contador incremental que revoca tokens viejos tras transferencias
}

export interface CheckoutPrimaryRequest {
  productName?: string;
  nominalPrice: number;
  buyerId: string;
  expirationDate?: string; // ISO-8601 UTC opcional; si no viene por defecto dura 30 días
  paymentToken?: string; // Token del PSP simulado ('fail' fuerza rechazo para tests)
}

export interface PublishOrderRequest {
  couponId: string;
  sellerId: string;
  askingPrice: number;
  requestedProductName?: string;
}

export interface BuyOrderRequest {
  buyerId: string;
  buyerCouponId?: string;
}

export interface ValidateQrRequest {
  token: string;
}

export interface ApiErrorBody {
  errorCode: string;
  message: string;
  details: Record<string, unknown>;
}
