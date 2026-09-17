import { TenantConfigDTO } from '../types';

const DEFAULT_CONFIGS: Record<string, TenantConfigDTO> = {
  festival: {
    tenantId: '11111111-1111-1111-1111-111111111111',
    companyName: 'Festival Musical Vibe',
    subdomain: 'festival',
    sellerTakeRatePct: 3.50,
    buyerTakeRatePct: 2.50,
    priceFloorPct: 50.00,
    priceCeilingPct: 200.00,
    maxDailyResalesPerUser: 5,
    closureHoursBeforeEvent: 2,
    platformRevenueSharePct: 30.00,
    theme: {
      primaryColor: '#6B21A8',
      accentColor: '#EC4899',
      surfaceColor: '#0F172A',
      fontFamily: 'Outfit, sans-serif',
      logoUrl: '/assets/logos/festival.png',
    },
  },
  hotel: {
    tenantId: '22222222-2222-2222-2222-222222222222',
    companyName: 'Grand Hotel & Spa',
    subdomain: 'hotel',
    sellerTakeRatePct: 5.00,
    buyerTakeRatePct: 2.00,
    priceFloorPct: 70.00,
    priceCeilingPct: 150.00,
    maxDailyResalesPerUser: 5,
    closureHoursBeforeEvent: 2,
    platformRevenueSharePct: 30.00,
    theme: {
      primaryColor: '#065F46',
      accentColor: '#10B981',
      surfaceColor: '#F8FAFC',
      fontFamily: 'Inter, sans-serif',
      logoUrl: '/assets/logos/hotel.png',
    },
  },
};

export async function fetchTenantConfig(tenantKey: string): Promise<TenantConfigDTO> {
  const isSubdomain = !tenantKey.includes('-');
  const headers: Record<string, string> = {};

  if (isSubdomain) {
    headers['Host'] = `${tenantKey}.smcta.local`;
  } else {
    headers['x-tenant-id'] = tenantKey;
  }

  try {
    const res = await fetch('/api/v1/tenant/config', {
      headers: {
        ...headers,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('[Tenant API Fallback] Usando configuración local de respaldo:', tenantKey);
    return DEFAULT_CONFIGS[tenantKey] || DEFAULT_CONFIGS['festival'];
  }
}

export async function saveTenantConfig(
  tenantKey: string,
  payload: Partial<TenantConfigDTO>
): Promise<TenantConfigDTO> {
  const isSubdomain = !tenantKey.includes('-');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSubdomain) {
    headers['Host'] = `${tenantKey}.smcta.local`;
  } else {
    headers['x-tenant-id'] = tenantKey;
  }

  try {
    const res = await fetch('/api/v1/admin/tenant/config', {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Error ${res.status} al guardar`);
    }

    return await res.json();
  } catch (err) {
    console.warn('[Tenant API Fallback] Guardando localmente en fallback:', err);
    const existing = DEFAULT_CONFIGS[tenantKey] || DEFAULT_CONFIGS['festival'];
    const updated: TenantConfigDTO = {
      ...existing,
      ...payload,
      theme: {
        ...existing.theme,
        ...(payload.theme || {}),
      },
    };
    DEFAULT_CONFIGS[tenantKey] = updated;
    return updated;
  }
}
