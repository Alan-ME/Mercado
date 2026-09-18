export interface TenantTheme {
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
  logoUrl: string;
}

export interface TenantConfigDTO {
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
