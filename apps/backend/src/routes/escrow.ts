import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
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

function safeHexEquals(received: string, expected: string): boolean {
  const sigBuf = Buffer.from(received, 'utf-8');
  const expBuf = Buffer.from(expected, 'utf-8');
  return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
}

function verifyWebhookHmacIfConfigured(request: FastifyRequest, secret: string | undefined): void {
  if (!secret) return;
  const rawSig = request.headers['x-psp-signature'];
  const sigHeader = typeof rawSig === 'string' ? rawSig : '';
  const serializedBody = JSON.stringify(request.body ?? {});
  const expected = createHmac('sha256', secret).update(serializedBody).digest('hex');
  if (!safeHexEquals(sigHeader, expected)) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Firma HMAC de webhook PSP inválida.');
  }
}

export function registerEscrowRoutes(app: FastifyInstance): void {
  app.get('/escrow/audit/:tenant_id', async (request) => {
    const { tenant_id } = auditParams.parse(request.params);
    if (tenant_id !== request.tenant.tenant_id) {
      throw new AppError(ErrorCode.FORBIDDEN, 'No se puede auditar otro tenant.');
    }
    return auditEscrow(request.server.ctx, request.tenant);
  });

  app.post('/escrow/webhook-release', async (request) => {
    verifyWebhookHmacIfConfigured(request, request.server.ctx.config.pspWebhookSecret);
    const body = releaseSchema.parse(request.body);
    return webhookRelease(
      request.server.ctx,
      request.tenant,
      body.couponId,
      body.transactionType,
    );
  });

  app.post('/escrow/expire', async (request) => {
    return expireDueCoupons(request.server.ctx, request.tenant);
  });
}
