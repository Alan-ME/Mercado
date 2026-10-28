import { AppError, ErrorCode, type TenantConfigDTO } from '@smcta/shared';
import type { ServiceContext } from './context.js';
import { type TenantRow, tenantToConfigDTO } from '../repositories/mappers.js';
import {
  updateTenantConfig,
  findTenantById,
  type TenantConfigPatch,
} from '../repositories/tenantRepo.js';

interface Range {
  min: number;
  max: number;
}

// Rangos del Portal Admin B2B (Hoja de Ruta Rol 3, US-05) + matriz .xlsx.
const RANGES: Record<string, Range> = {
  sellerTakeRatePct: { min: 1, max: 10 },
  buyerTakeRatePct: { min: 0, max: 10 },
  priceFloorPct: { min: 10, max: 90 },
  priceCeilingPct: { min: 100, max: 500 },
  maxDailyResalesPerUser: { min: 1, max: 20 },
  closureHoursBeforeEvent: { min: 1, max: 72 },
  platformRevenueSharePct: { min: 10, max: 50 },
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function assertRange(field: keyof typeof RANGES, value: number | undefined): void {
  if (value === undefined) return;
  const r = RANGES[field]!;
  if (!Number.isFinite(value) || value < r.min || value > r.max) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${field} debe estar entre ${r.min} y ${r.max} (recibido: ${value}).`,
      { field, ...r, value },
    );
  }
}

/** US-05: persiste la configuración de negocio y marca del tenant, validando rangos. */
export async function updateConfig(
  ctx: ServiceContext,
  tenant: TenantRow,
  patch: TenantConfigPatch,
): Promise<TenantConfigDTO> {
  assertRange('sellerTakeRatePct', patch.sellerTakeRatePct);
  assertRange('buyerTakeRatePct', patch.buyerTakeRatePct);
  assertRange('priceFloorPct', patch.priceFloorPct);
  assertRange('priceCeilingPct', patch.priceCeilingPct);
  assertRange('maxDailyResalesPerUser', patch.maxDailyResalesPerUser);
  assertRange('closureHoursBeforeEvent', patch.closureHoursBeforeEvent);
  assertRange('platformRevenueSharePct', patch.platformRevenueSharePct);

  for (const key of ['themePrimaryColor', 'themeAccentColor', 'themeSurfaceColor'] as const) {
    const v = patch[key];
    if (v !== undefined && !HEX.test(v)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `${key} debe ser un color HEX válido.`, { value: v });
    }
  }

  await updateTenantConfig(ctx.db, tenant.tenant_id, patch);
  const updated = await findTenantById(ctx.db, tenant.tenant_id);
  return tenantToConfigDTO(updated!);
}
