import { Router, Request, Response } from 'express';
import { escrowService } from '../services/escrow.service';

const router = Router();

/**
 * POST /psp/payments/create
 * Crea una intención de pago simulada (Stripe PaymentIntent / MercadoPago Preference)
 */
router.post('/create', (req: Request, res: Response) => {
  const { tenantId, userId, amount, currency, metadata } = req.body;

  if (!tenantId || amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({
      error: 'PARAMETROS_INVALIDOS',
      message: 'tenantId y amount (> 0) son obligatorios.',
    });
    return;
  }

  const paymentIntent = escrowService.createPaymentIntent({
    tenantId,
    userId: userId || 'anonymous_user',
    amount: Number(amount),
    currency,
    metadata,
  });

  res.status(201).json(paymentIntent);
});

/**
 * GET /psp/payments/:id
 * Consulta el estado actual de una intención de pago
 */
router.get('/:id', (req: Request, res: Response) => {
  const pi = escrowService.getPaymentIntent(req.params.id);
  if (!pi) {
    res.status(404).json({ error: 'PAYMENT_INTENT_NOT_FOUND' });
    return;
  }
  res.status(200).json(pi);
});

/**
 * POST /psp/payments/:id/simulate-success
 * Simula la aprobación exitosa del pago y dispara el webhook a Rol 1
 */
router.post('/:id/simulate-success', async (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body || {};
    const result = await escrowService.simulatePaymentSuccess(req.params.id, webhookUrl);
    res.status(200).json({
      message: 'Pago simulado con éxito y fondos retenidos en Escrow.',
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      error: 'SIMULATION_ERROR',
      message: error instanceof Error ? error.message : 'Error al simular éxito',
    });
  }
});

/**
 * POST /psp/payments/:id/simulate-failure
 * Simula el rechazo del pago por fondos insuficientes u otra causa
 */
router.post('/:id/simulate-failure', async (req: Request, res: Response) => {
  try {
    const { reason, webhookUrl } = req.body || {};
    const result = await escrowService.simulatePaymentFailure(req.params.id, reason, webhookUrl);
    res.status(200).json({
      message: 'Rechazo de pago simulado.',
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      error: 'SIMULATION_ERROR',
      message: error instanceof Error ? error.message : 'Error al simular falla',
    });
  }
});

export default router;
