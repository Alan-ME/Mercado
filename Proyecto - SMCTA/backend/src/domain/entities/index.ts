export enum CouponState {
  EMITIDO = 'EMITIDO',
  EN_WALLET = 'EN_WALLET',
  PUBLICADO_P2P = 'PUBLICADO_P2P',
  CANJEADO = 'CANJEADO',
  VENCIDO = 'VENCIDO'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  CANCELLED = 'CANCELLED'
}

export enum LedgerTransactionType {
  CHECKOUT = 'CHECKOUT',
  P2P_SPLIT = 'P2P_SPLIT',
  REDEEM_RELEASE = 'REDEEM_RELEASE',
  REFUND = 'REFUND'
}

export interface TenantConfig {
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
  themeConfig?: {
    primaryColor: string;
    accentColor: string;
    surfaceColor: string;
    fontFamily: string;
    logoUrl: string;
  };
  createdAt?: string;
}

export interface User {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  createdAt?: string;
}

export interface Coupon {
  couponId: string;
  tenantId: string;
  currentOwnerId: string;
  nominalPrice: number;
  state: CouponState;
  qrEncryptedToken: string;
  expirationDate: string;
  createdAt?: string;
}

export interface P2POrder {
  orderId: string;
  tenantId: string;
  couponId: string;
  sellerId: string;
  askingPrice: number;
  side: OrderSide;
  status: OrderStatus;
  createdAt?: string;
}

export interface CommissionBreakdown {
  nominalPrice: number;
  askingPrice: number;
  sellerFeePct: number;
  sellerFeeAmount: number;
  netSellerProceeds: number;
  buyerFeePct: number;
  buyerFeeAmount: number;
  totalBuyerPrice: number;
  platformShareAmount?: number;
}

export interface QRTokenPayload {
  couponId: string;
  tenantId: string;
  ownerId: string;
  nonce: string;
  timestamp: number;
  signature: string;
}
