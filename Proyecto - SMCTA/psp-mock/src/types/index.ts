export type PaymentIntentStatus = 
  | 'REQUIRES_PAYMENT_METHOD'
  | 'REQUIRES_CAPTURE'
  | 'SUCCEEDED'
  | 'FAILED';

export interface PaymentIntent {
  id: string;
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  createdAt: string;
  clientSecret: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export type EscrowTransactionType = 'HELD' | 'RELEASED' | 'REFUNDED';

export interface EscrowTransaction {
  id: string;
  tenantId: string;
  couponId?: string;
  amount: number;
  type: EscrowTransactionType;
  timestamp: string;
  description: string;
}

export interface EscrowAccount {
  tenantId: string;
  balanceHeld: number;
  totalReleased: number;
  totalRefunded: number;
  transactions: EscrowTransaction[];
}

export type PSPEventType = 
  | 'payment_intent.succeeded'
  | 'payment_intent.failed'
  | 'escrow.funds_released';

export interface PSPWebhookEvent {
  id: string;
  type: PSPEventType;
  created: number;
  data: {
    object: Record<string, unknown>;
  };
}

export interface WebhookDispatchLog {
  id: string;
  event: PSPWebhookEvent;
  targetUrl: string;
  dispatchedAt: string;
  responseStatus?: number;
  responseBody?: unknown;
  success: boolean;
  errorMessage?: string;
}
