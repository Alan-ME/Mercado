/**
 * Contrato oficial de Token QR firmado criptográficamente
 * Fuente: 00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md
 */
export interface QRTokenPayload {
  couponId: string;
  tenantId: string;
  ownerId: string;
  nonce: string;                // Generado aleatoriamente cada 30 segundos
  timestamp: number;            // Epoch millis
  signature: string;            // HMAC-SHA256 firmado con clave secreta del tenant
  nominalPrice?: number;        // Opcional para presentación visual
}

export type RedemptionStatus = 
  | 'SUCCESS'
  | 'EXPIRED'
  | 'NOT_IN_WALLET'
  | 'INVALID_SIGNATURE'
  | 'TENANT_MISMATCH'
  | 'ERROR';

export interface RedemptionResult {
  success: boolean;
  status: RedemptionStatus;
  couponId?: string;
  tenantId?: string;
  amountReleased?: number;
  message: string;
  payoutId?: string;
  timestamp: string;
}

export interface RedemptionLogEntry {
  id: string;
  couponId: string;
  tenantName: string;
  status: RedemptionStatus;
  success: boolean;
  amount: number;
  timestamp: string;
  message: string;
}
