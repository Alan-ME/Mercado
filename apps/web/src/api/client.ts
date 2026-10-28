import type {
  CouponDTO,
  P2POrderDTO,
  TenantConfigDTO,
  ApiErrorBody,
} from '@smcta/shared';

export class ApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface DevTenant {
  tenantId: string;
  subdomain: string;
  companyName: string;
  primaryColor: string;
  accentColor: string;
}

export interface DevUser {
  userId: string;
  displayName: string;
  email: string;
}

/** CouponDTO enriquecido con el nombre de producto para la UI. */
export type WalletCoupon = CouponDTO & { productName: string };

export type ActivityType =
  | 'PRIMARY_PURCHASE'
  | 'P2P_LISTED'
  | 'P2P_SALE'
  | 'P2P_BUY'
  | 'REDEEM'
  | 'P2P_CANCELLED';

export interface ActivityEvent {
  eventId: string;
  type: ActivityType;
  title: string;
  amount: number;
  isRead: boolean;
  relatedCouponId: string | null;
  relatedOrderId: string | null;
  createdAt: string;
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; tenant?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.tenant) headers['x-tenant-id'] = opts.tenant;

  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      err.errorCode ?? 'UNKNOWN',
      err.message ?? `Error HTTP ${res.status}`,
      res.status,
      err.details ?? {},
    );
  }
  return data as T;
}

export const api = {
  getTenants: () => request<DevTenant[]>('/api/v1/dev/tenants'),

  getConfig: (tenant: string) =>
    request<TenantConfigDTO>('/api/v1/tenant/config', { tenant }),

  getUsers: (tenant: string) => request<DevUser[]>('/api/v1/dev/users', { tenant }),

  getRedeemableCoupons: (tenant: string) =>
    request<{ couponId: string; productName: string; ownerId: string }[]>('/api/v1/dev/coupons', { tenant }),

  checkout: (
    tenant: string,
    body: { nominalPrice: number; buyerId: string; productName?: string; expirationDate?: string; paymentToken?: string },
  ) => request<CouponDTO>('/api/v1/checkout/primary', { method: 'POST', body, tenant }),

  getWallet: (tenant: string, ownerId: string) =>
    request<WalletCoupon[]>(`/api/v1/coupons/my-wallet?ownerId=${encodeURIComponent(ownerId)}`, { tenant }),

  getQrToken: (tenant: string, couponId: string) =>
    request<{ token: string; expiresAt: number; ttlMs: number; couponId: string; ownerId: string }>(
      `/api/v1/coupons/${couponId}/qr-token`,
      { tenant },
    ),

  listOrders: (tenant: string) => request<P2POrderDTO[]>('/api/v1/p2p/orders', { tenant }),

  publishOrder: (
    tenant: string,
    body: { couponId: string; sellerId: string; askingPrice: number },
  ) => request<P2POrderDTO>('/api/v1/p2p/orders', { method: 'POST', body, tenant }),

  buyOrder: (tenant: string, orderId: string, buyerId: string) =>
    request<P2POrderDTO>(`/api/v1/p2p/orders/${orderId}/buy`, {
      method: 'POST',
      body: { buyerId },
      tenant,
    }),

  cancelOrder: (tenant: string, orderId: string, sellerId: string) =>
    request<{ ok: true }>(`/api/v1/p2p/orders/${orderId}/cancel`, {
      method: 'POST',
      body: { sellerId },
      tenant,
    }),

  validateQr: (tenant: string, token: string) =>
    request<{
      couponId: string;
      state: string;
      releasedToMerchant: number;
      webhook: { event: string; amountReleased: number };
    }>('/api/v1/tpv/validate-qr', { method: 'POST', body: { token }, tenant }),

  audit: (tenant: string, tenantId: string) =>
    request<{
      totalInEscrow: number;
      expectedLiveNominal: number;
      difference: number;
      isBalanced: boolean;
      tenantFeesAccumulated: number;
      platformFeesAccumulated: number;
      redeemed: number;
      expired: number;
      redemptionRatePct: number;
    }>(`/api/v1/escrow/audit/${tenantId}`, { tenant }),

  expire: (tenant: string) =>
    request<{ expired: number }>('/api/v1/escrow/expire', { method: 'POST', body: {}, tenant }),

  updateConfig: (tenant: string, patch: Record<string, number | string>) =>
    request<TenantConfigDTO>('/api/v1/admin/tenant/config', { method: 'PUT', body: patch, tenant }),

  getNotifications: (tenant: string, userId: string) =>
    request<{ unreadCount: number; events: ActivityEvent[] }>(
      `/api/v1/notifications?userId=${encodeURIComponent(userId)}`,
      { tenant },
    ),

  markNotificationsRead: (tenant: string, userId: string) =>
    request<{ ok: true }>('/api/v1/notifications/read', { method: 'POST', body: { userId }, tenant }),

  getTransactions: (tenant: string, userId: string, type?: string) =>
    request<ActivityEvent[]>(
      `/api/v1/transactions?userId=${encodeURIComponent(userId)}${type ? `&type=${type}` : ''}`,
      { tenant },
    ),
};
