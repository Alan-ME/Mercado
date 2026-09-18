import crypto from 'crypto';
import { config } from '../config';
import {
  PaymentIntent,
  EscrowAccount,
  EscrowTransaction,
  PSPWebhookEvent,
  WebhookDispatchLog,
} from '../types';
import { webhookService } from './webhook.service';

class EscrowService {
  private paymentIntents = new Map<string, PaymentIntent>();
  private escrowAccounts = new Map<string, EscrowAccount>();

  private getOrCreateAccount(tenantId: string): EscrowAccount {
    let account = this.escrowAccounts.get(tenantId);
    if (!account) {
      account = {
        tenantId,
        balanceHeld: 0,
        totalReleased: 0,
        totalRefunded: 0,
        transactions: [],
      };
      this.escrowAccounts.set(tenantId, account);
    }
    return account;
  }

  /**
   * Crea una nueva intención de cobro simulada (Stripe PaymentIntent / MercadoPago Preference)
   */
  public createPaymentIntent(params: {
    tenantId: string;
    userId: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
  }): PaymentIntent {
    const id = `pi_mock_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `${id}_secret_${crypto.randomBytes(8).toString('hex')}`;

    const paymentIntent: PaymentIntent = {
      id,
      tenantId: params.tenantId,
      userId: params.userId,
      amount: Number(params.amount.toFixed(2)),
      currency: (params.currency || 'USD').toUpperCase(),
      status: 'REQUIRES_CAPTURE',
      createdAt: new Date().toISOString(),
      clientSecret,
      metadata: params.metadata || {},
    };

    this.paymentIntents.set(id, paymentIntent);
    return paymentIntent;
  }

  public getPaymentIntent(id: string): PaymentIntent | null {
    return this.paymentIntents.get(id) || null;
  }

  /**
   * Simula la aprobación exitosa del pago, ingresa fondos a la custodia de Escrow y dispara webhook a Rol 1
   */
  public async simulatePaymentSuccess(
    paymentIntentId: string,
    customWebhookUrl?: string
  ): Promise<{ paymentIntent: PaymentIntent; webhookLog: WebhookDispatchLog }> {
    const pi = this.paymentIntents.get(paymentIntentId);
    if (!pi) {
      throw new Error(`PaymentIntent ${paymentIntentId} no encontrado`);
    }

    pi.status = 'SUCCEEDED';

    // Fondeo de cuenta Escrow del Tenant
    const account = this.getOrCreateAccount(pi.tenantId);
    account.balanceHeld += pi.amount;

    const tx: EscrowTransaction = {
      id: `tx_${crypto.randomUUID()}`,
      tenantId: pi.tenantId,
      amount: pi.amount,
      type: 'HELD',
      timestamp: new Date().toISOString(),
      description: `Fondeo de custodia Escrow por Checkout Primario (Intent: ${pi.id})`,
    };
    account.transactions.push(tx);

    // Construcción del evento de Webhook
    const event: PSPWebhookEvent = {
      id: `evt_${crypto.randomUUID()}`,
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          paymentIntentId: pi.id,
          tenantId: pi.tenantId,
          userId: pi.userId,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          metadata: pi.metadata,
        },
      },
    };

    const targetUrl = customWebhookUrl || config.backendCoreWebhookUrl;
    const webhookLog = await webhookService.dispatchWebhook(targetUrl, event);

    return { paymentIntent: pi, webhookLog };
  }

  /**
   * Simula el rechazo de la transacción y notifica por webhook
   */
  public async simulatePaymentFailure(
    paymentIntentId: string,
    reason?: string,
    customWebhookUrl?: string
  ): Promise<{ paymentIntent: PaymentIntent; webhookLog: WebhookDispatchLog }> {
    const pi = this.paymentIntents.get(paymentIntentId);
    if (!pi) {
      throw new Error(`PaymentIntent ${paymentIntentId} no encontrado`);
    }

    pi.status = 'FAILED';
    pi.failureReason = reason || 'FONDOS_INSUFICIENTES_SIMULADOS';

    const event: PSPWebhookEvent = {
      id: `evt_${crypto.randomUUID()}`,
      type: 'payment_intent.failed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          paymentIntentId: pi.id,
          tenantId: pi.tenantId,
          userId: pi.userId,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          failureReason: pi.failureReason,
        },
      },
    };

    const targetUrl = customWebhookUrl || config.backendCoreWebhookUrl;
    const webhookLog = await webhookService.dispatchWebhook(targetUrl, event);

    return { paymentIntent: pi, webhookLog };
  }

  /**
   * Simula la liberación de fondos de custodia (Payout / Transfer) tras canje TPV (REDEEM_RELEASE)
   */
  public async releaseFunds(params: {
    tenantId: string;
    couponId?: string;
    amount: number;
    destinationBankAccountId?: string;
    customWebhookUrl?: string;
  }): Promise<{
    payoutId: string;
    account: EscrowAccount;
    webhookLog: WebhookDispatchLog;
  }> {
    const account = this.getOrCreateAccount(params.tenantId);
    const releaseAmount = Number(params.amount.toFixed(2));

    if (account.balanceHeld < releaseAmount) {
      throw new Error(
        `Balance insuficiente en cuenta de custodia. Retenido: $${account.balanceHeld}, Solicitado: $${releaseAmount}`
      );
    }

    account.balanceHeld -= releaseAmount;
    account.totalReleased += releaseAmount;

    const payoutId = `po_mock_${crypto.randomBytes(10).toString('hex')}`;

    const tx: EscrowTransaction = {
      id: `tx_${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      couponId: params.couponId,
      amount: releaseAmount,
      type: 'RELEASED',
      timestamp: new Date().toISOString(),
      description: `Liberación y transferencia a cuenta comercial (${params.destinationBankAccountId || 'BANK_DEFAULT_B2B'}) por Canje TPV`,
    };
    account.transactions.push(tx);

    const event: PSPWebhookEvent = {
      id: `evt_${crypto.randomUUID()}`,
      type: 'escrow.funds_released',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          payoutId,
          tenantId: params.tenantId,
          couponId: params.couponId,
          amountReleased: releaseAmount,
          remainingHeldBalance: account.balanceHeld,
          destinationAccount: params.destinationBankAccountId || 'BANK_DEFAULT_B2B',
          status: 'TRANSFERRED',
        },
      },
    };

    const targetUrl = params.customWebhookUrl || config.backendCoreEscrowReleaseUrl;
    const webhookLog = await webhookService.dispatchWebhook(targetUrl, event);

    return { payoutId, account, webhookLog };
  }

  public getAccount(tenantId: string): EscrowAccount {
    return this.getOrCreateAccount(tenantId);
  }

  public getAllAccounts(): EscrowAccount[] {
    return Array.from(this.escrowAccounts.values());
  }

  public reset(): void {
    this.paymentIntents.clear();
    this.escrowAccounts.clear();
  }
}

export const escrowService = new EscrowService();
