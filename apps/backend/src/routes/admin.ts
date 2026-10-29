import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { updateConfig } from '../services/adminService.js';

const patchSchema = z.object({
  sellerTakeRatePct: z.number().optional(),
  buyerTakeRatePct: z.number().optional(),
  priceFloorPct: z.number().optional(),
  priceCeilingPct: z.number().optional(),
  maxDailyResalesPerUser: z.number().int().optional(),
  closureHoursBeforeEvent: z.number().int().optional(),
  platformRevenueSharePct: z.number().optional(),
  themePrimaryColor: z.string().optional(),
  themeAccentColor: z.string().optional(),
  themeSurfaceColor: z.string().optional(),
  themeFontFamily: z.string().optional(),
  themeLogoUrl: z.string().optional(),
});

// Portal de Administración B2B: actualiza parámetros de negocio (bandas de precios, comisiones)
// y tema visual en caliente sin reiniciar el servidor ni recompilar la SPA.
export function registerAdminRoutes(app: FastifyInstance): void {
  app.put('/admin/tenant/config', async (request) => {
    const patch = patchSchema.parse(request.body);
    return updateConfig(request.server.ctx, request.tenant, patch);
  });
}
