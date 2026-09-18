import { Router, Response } from 'express';
import { AuthenticatedTenantRequest, ApiErrorResponse } from '../types';
import { tenantService } from '../services/tenant.service';

const router = Router();

/**
 * GET /api/v1/tenant/config
 * Retorna la configuración completa del Tenant resuelto (colores, marca, comisiones y límites).
 * Consumido por Rol 2 (Frontend) para tematización dinámica y validaciones en UI.
 */
router.get('/config', (req: AuthenticatedTenantRequest, res: Response) => {
  if (!req.tenant) {
    res.status(404).json({
      errorCode: 'TENANT_NOT_FOUND',
      message: 'No se ha resuelto el contexto de Tenant para esta solicitud.',
    });
    return;
  }

  const dto = tenantService.toDTO(req.tenant);
  res.status(200).json(dto);
});

/**
 * PUT /api/v1/tenant/config y PUT /api/v1/admin/tenant/config
 * Actualiza los parámetros de negocio y tema visual del Tenant (US-05).
 */
router.put('/config', async (req: AuthenticatedTenantRequest, res: Response) => {
  if (!req.tenant) {
    res.status(404).json({
      errorCode: 'TENANT_NOT_FOUND',
      message: 'No se ha resuelto el contexto de Tenant para esta solicitud.',
    });
    return;
  }

  const {
    sellerTakeRatePct,
    buyerTakeRatePct,
    priceFloorPct,
    priceCeilingPct,
    maxDailyResalesPerUser,
    closureHoursBeforeEvent,
    theme,
  } = req.body || {};

  const validationErrors: Record<string, string> = {};

  if (sellerTakeRatePct !== undefined) {
    const val = Number(sellerTakeRatePct);
    if (isNaN(val) || val < 1.0 || val > 10.0) {
      validationErrors.sellerTakeRatePct = 'El Take-Rate de Vendedor debe estar entre 1.0% y 10.0%.';
    }
  }

  if (buyerTakeRatePct !== undefined) {
    const val = Number(buyerTakeRatePct);
    if (isNaN(val) || val < 0.0 || val > 10.0) {
      validationErrors.buyerTakeRatePct = 'El Take-Rate de Comprador debe estar entre 0.0% y 10.0%.';
    }
  }

  if (priceFloorPct !== undefined) {
    const val = Number(priceFloorPct);
    if (isNaN(val) || val < 10.0 || val > 90.0) {
      validationErrors.priceFloorPct = 'El Piso de Price Collar debe estar entre 10.0% y 90.0% del nominal.';
    }
  }

  if (priceCeilingPct !== undefined) {
    const val = Number(priceCeilingPct);
    if (isNaN(val) || val < 100.0 || val > 500.0) {
      validationErrors.priceCeilingPct = 'El Techo de Price Collar debe estar entre 100.0% y 500.0% del nominal.';
    }
  }

  if (maxDailyResalesPerUser !== undefined) {
    const val = Number(maxDailyResalesPerUser);
    if (!Number.isInteger(val) || val < 1 || val > 20) {
      validationErrors.maxDailyResalesPerUser = 'El máximo de reventas diarias debe ser un entero entre 1 y 20.';
    }
  }

  if (closureHoursBeforeEvent !== undefined) {
    const val = Number(closureHoursBeforeEvent);
    if (!Number.isInteger(val) || val < 1 || val > 72) {
      validationErrors.closureHoursBeforeEvent = 'El cierre previo al evento debe ser entre 1 y 72 horas.';
    }
  }

  if (Object.keys(validationErrors).length > 0) {
    const errorResponse: ApiErrorResponse = {
      errorCode: 'INVALID_TENANT_CONFIGURATION',
      message: 'Uno o más parámetros de configuración violan las reglas de negocio permitidas.',
      details: validationErrors,
    };
    res.status(422).json(errorResponse);
    return;
  }

  try {
    const updatedTenant = await tenantService.updateTenantConfig(req.tenant.tenantId, {
      sellerTakeRatePct: sellerTakeRatePct !== undefined ? Number(sellerTakeRatePct) : undefined,
      buyerTakeRatePct: buyerTakeRatePct !== undefined ? Number(buyerTakeRatePct) : undefined,
      priceFloorPct: priceFloorPct !== undefined ? Number(priceFloorPct) : undefined,
      priceCeilingPct: priceCeilingPct !== undefined ? Number(priceCeilingPct) : undefined,
      maxDailyResalesPerUser: maxDailyResalesPerUser !== undefined ? Number(maxDailyResalesPerUser) : undefined,
      closureHoursBeforeEvent: closureHoursBeforeEvent !== undefined ? Number(closureHoursBeforeEvent) : undefined,
      theme,
    });

    const dto = tenantService.toDTO(updatedTenant);
    res.status(200).json(dto);
  } catch (err) {
    res.status(500).json({
      errorCode: 'TENANT_UPDATE_ERROR',
      message: err instanceof Error ? err.message : 'Error al actualizar configuración del Tenant.',
    });
  }
});

export default router;
