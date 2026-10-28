import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode, LedgerTransactionType } from '@smcta/shared';
import {
  auditEscrow,
  webhookRelease,
  expireDueCoupons,
} from '../services/escrowService.js';

const auditParams = z.object({ tenant_id: z.string().min(1) });
const releaseSchema = z.object({
  couponId: z.string().uuid(),
  transactionType: z
    .enum([LedgerTransactionType.REFUND, LedgerTransactionType.REDEEM_RELEASE])
    .default(LedgerTransactionType.REFUND),
});

/** Endpoints de custodia/auditoría — TASK-006 / QA-03 + webhook de liberación. */
export function registerEscrowRoutes(app: FastifyInstance): void {
  // GET /api/v1/escrow/audit/:tenant_id — auditoría de balance (diferencia = 0).
  app.get('/escrow/audit/:tenant_id', async (request) => {
    const { tenant_id } = auditParams.parse(request.params);
    // Aislamiento: sólo se audita el tenant del contexto resuelto.
    if (tenant_id !== request.tenant.tenant_id) {
      throw new AppError(ErrorCode.FORBIDDEN, 'No se puede auditar otro tenant.');
    }
    return auditEscrow(request.server.ctx, request.tenant);
  });

  // POST /api/v1/escrow/webhook-release — libera custodia (PSP / breakage).
  app.post('/escrow/webhook-release', async (request) => {
    const body = releaseSchema.parse(request.body);
    return webhookRelease(
      request.server.ctx,
      request.tenant,
      body.couponId,
      body.transactionType,
    );
  });

  // POST /api/v1/escrow/expire — dispara RN-04 (expiración de cupones vencidos).
  app.post('/escrow/expire', async (request) => {
    return expireDueCoupons(request.server.ctx, request.tenant);
  });
}
