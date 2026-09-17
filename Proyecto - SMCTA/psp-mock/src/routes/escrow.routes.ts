import { Router, Request, Response } from 'express';
import { escrowService } from '../services/escrow.service';
import { webhookService } from '../services/webhook.service';

const router = Router();

/**
 * POST /psp/escrow/release
 * Simula la liberación de fondos de custodia bancaria tras la validación física en TPV (TASK-008)
 */
router.post('/release', async (req: Request, res: Response) => {
  const { tenantId, couponId, amount, destinationBankAccountId, webhookUrl } = req.body;

  if (!tenantId || amount === undefined || Number(amount) <= 0) {
    res.status(400).json({
      error: 'PARAMETROS_INVALIDOS',
      message: 'tenantId y amount (> 0) son obligatorios para la liberación.',
    });
    return;
  }

  try {
    const result = await escrowService.releaseFunds({
      tenantId,
      couponId,
      amount: Number(amount),
      destinationBankAccountId,
      customWebhookUrl: webhookUrl,
    });

    res.status(200).json({
      message: 'Fondos de custodia liberados exitosamente hacia la cuenta comercial.',
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      error: 'ESCROW_RELEASE_FAILED',
      message: error instanceof Error ? error.message : 'Error al liberar fondos de custodia',
    });
  }
});

/**
 * GET /psp/escrow/balance/:tenantId
 * Consulta el saldo actual en custodia (Escrow) segregada por Tenant
 */
router.get('/balance/:tenantId', (req: Request, res: Response) => {
  const account = escrowService.getAccount(req.params.tenantId);
  res.status(200).json(account);
});

/**
 * GET /psp/escrow/accounts
 * Lista todas las cuentas de custodia activas
 */
router.get('/accounts', (_req: Request, res: Response) => {
  const accounts = escrowService.getAllAccounts();
  res.status(200).json(accounts);
});

/**
 * GET /psp/webhooks/history
 * Historial de auditoría de los últimos webhooks despachados
 */
router.get('/webhooks/history', (_req: Request, res: Response) => {
  const history = webhookService.getHistory();
  res.status(200).json({
    total: history.length,
    history,
  });
});

/**
 * DELETE /psp/webhooks/history
 * Limpia el historial para pruebas limpias
 */
router.delete('/webhooks/history', (_req: Request, res: Response) => {
  webhookService.clearHistory();
  res.status(200).json({ message: 'Historial de webhooks limpiado.' });
});

export default router;
