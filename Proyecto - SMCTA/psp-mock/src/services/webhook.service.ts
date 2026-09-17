import crypto from 'crypto';
import { config } from '../config';
import { PSPWebhookEvent, WebhookDispatchLog } from '../types';

class WebhookService {
  private dispatchLogs: WebhookDispatchLog[] = [];
  private readonly maxLogs = 50;

  /**
   * Genera la firma HMAC-SHA256 del payload
   */
  public generateSignature(payloadString: string): string {
    return crypto
      .createHmac('sha256', config.pspWebhookSecret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Despacha un evento PSP mediante HTTP POST hacia el endpoint suscrito
   */
  public async dispatchWebhook(targetUrl: string, event: PSPWebhookEvent): Promise<WebhookDispatchLog> {
    const payloadString = JSON.stringify(event);
    const signature = this.generateSignature(payloadString);
    const timestamp = Date.now().toString();

    const logEntry: WebhookDispatchLog = {
      id: crypto.randomUUID(),
      event,
      targetUrl,
      dispatchedAt: new Date().toISOString(),
      success: false,
    };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-psp-signature': signature,
          'x-psp-timestamp': timestamp,
          'User-Agent': 'SMCTA-PSP-Simulator/1.0',
        },
        body: payloadString,
      });

      logEntry.responseStatus = response.status;
      try {
        logEntry.responseBody = await response.json();
      } catch {
        logEntry.responseBody = await response.text();
      }

      logEntry.success = response.ok;
    } catch (err) {
      logEntry.success = false;
      logEntry.errorMessage = err instanceof Error ? err.message : 'Error al conectar con el backend receptor';
    }

    this.saveLog(logEntry);
    return logEntry;
  }

  public getHistory(): WebhookDispatchLog[] {
    return [...this.dispatchLogs].reverse();
  }

  public clearHistory(): void {
    this.dispatchLogs = [];
  }

  private saveLog(log: WebhookDispatchLog): void {
    this.dispatchLogs.push(log);
    if (this.dispatchLogs.length > this.maxLogs) {
      this.dispatchLogs.shift();
    }
  }
}

export const webhookService = new WebhookService();
