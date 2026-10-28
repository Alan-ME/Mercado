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

interface RequestOptions {
  method?: string;
  body?: unknown;
  tenant?: string;
  userId?: string;
}

function buildHeaders(opts: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.tenant) headers['x-tenant-id'] = opts.tenant;
  if (opts.userId) headers['x-user-id'] = opts.userId;
  return headers;
}

function toApiError(status: number, data: unknown): ApiError {
  const err = (data ?? {}) as Partial<ApiErrorBody>;
  const code = err.errorCode ? err.errorCode : 'UNKNOWN';
  const msg = err.message ? err.message : `Error HTTP ${status}`;
  return new ApiError(code, msg, status, err.details ?? {});
}

function serializeBody(body: unknown): string | undefined {
  return body !== undefined ? JSON.stringify(body) : undefined;
}

function parseJsonOrNull(text: string): unknown {
  return text ? JSON.parse(text) : null;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: buildHeaders(opts),
    body: serializeBody(opts.body),
  });

  const data = parseJsonOrNull(await res.text());
  if (!res.ok) throw toApiError(res.status, data);
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

  getQrToken: (tenant: string, couponId: string, userId?: string) =>
    request<{ token: string; expiresAt: number; ttlMs: number; couponId: string; ownerId: string }>(
      `/api/v1/coupons/${couponId}/qr-token`,
      { tenant, userId },
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

  notificationsStreamUrl: (tenant: string, userId: string) =>
    `/api/v1/notifications/stream?userId=${encodeURIComponent(userId)}&tenant=${encodeURIComponent(tenant)}`,

  markNotificationsRead: (tenant: string, userId: string) =>
    request<{ ok: true }>('/api/v1/notifications/read', { method: 'POST', body: { userId }, tenant }),

  getTransactions: (tenant: string, userId: string, type?: string) => {
    const suffix = type ? `&type=${encodeURIComponent(type)}` : '';
    return request<ActivityEvent[]>(
      `/api/v1/transactions?userId=${encodeURIComponent(userId)}${suffix}`,
      { tenant },
    );
  },
};
