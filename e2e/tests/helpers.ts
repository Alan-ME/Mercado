import type { APIRequestContext } from '@playwright/test';

export const H = (tenant: string) => ({ 'x-tenant-id': tenant });

export async function usersOf(request: APIRequestContext, tenant: string): Promise<string[]> {
  const res = await request.get('/api/v1/dev/users', { headers: H(tenant) });
  const users = (await res.json()) as { userId: string }[];
  return users.map((u) => u.userId);
}

export async function tenantIdOf(request: APIRequestContext, tenant: string): Promise<string> {
  const res = await request.get('/api/v1/tenant/config', { headers: H(tenant) });
  return ((await res.json()) as { tenantId: string }).tenantId;
}

export async function checkout(
  request: APIRequestContext,
  tenant: string,
  buyerId: string,
  nominalPrice = 100,
): Promise<string> {
  const res = await request.post('/api/v1/checkout/primary', {
    headers: H(tenant),
    data: { nominalPrice, buyerId, productName: 'E2E' },
  });
  return ((await res.json()) as { couponId: string }).couponId;
}

export async function publish(
  request: APIRequestContext,
  tenant: string,
  couponId: string,
  sellerId: string,
  askingPrice: number,
): Promise<string> {
  const res = await request.post('/api/v1/p2p/orders', {
    headers: H(tenant),
    data: { couponId, sellerId, askingPrice },
  });
  return ((await res.json()) as { orderId: string }).orderId;
}
