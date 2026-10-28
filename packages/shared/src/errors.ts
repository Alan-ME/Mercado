/**
 * Códigos de error semánticos inflexibles.
 * Fuente: 00_Protocolo_de_Alineacion_y_Contratos_Compartidos.md §4
 *
 * Cualquier error de negocio retorna { errorCode, message, details } con el
 * código HTTP exacto aquí definido. Los tests de QA (QA-01) verifican estos códigos.
 */

export const ErrorCode = {
  PRICE_COLLAR_VIOLATION: 'PRICE_COLLAR_VIOLATION',
  COUPON_NOT_IN_WALLET: 'COUPON_NOT_IN_WALLET',
  P2P_ORDER_LOCKED: 'P2P_ORDER_LOCKED',
  DAILY_RESALE_LIMIT_REACHED: 'DAILY_RESALE_LIMIT_REACHED',
  QR_TOKEN_EXPIRED: 'QR_TOKEN_EXPIRED',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  // Códigos auxiliares de la implementación (no rompen el contrato):
  COUPON_NOT_FOUND: 'COUPON_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_NOT_OPEN: 'ORDER_NOT_OPEN',
  INVALID_QR_SIGNATURE: 'INVALID_QR_SIGNATURE',
  P2P_WINDOW_CLOSED: 'P2P_WINDOW_CLOSED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Mapeo canónico código de negocio -> HTTP status (Protocolo §4). */
export const ERROR_HTTP_STATUS: Record<ErrorCodeValue, number> = {
  PRICE_COLLAR_VIOLATION: 422,
  COUPON_NOT_IN_WALLET: 409,
  P2P_ORDER_LOCKED: 423,
  DAILY_RESALE_LIMIT_REACHED: 429,
  QR_TOKEN_EXPIRED: 401,
  TENANT_NOT_FOUND: 404,
  COUPON_NOT_FOUND: 404,
  ORDER_NOT_FOUND: 404,
  ORDER_NOT_OPEN: 409,
  INVALID_QR_SIGNATURE: 401,
  P2P_WINDOW_CLOSED: 422,
  VALIDATION_ERROR: 400,
  PAYMENT_REJECTED: 402,
  FORBIDDEN: 403,
};

/**
 * Error de dominio serializable al formato estándar del Protocolo.
 * El manejador global de errores lo traduce a la respuesta HTTP.
 */
export class AppError extends Error {
  readonly errorCode: ErrorCodeValue;
  readonly httpStatus: number;
  readonly details: Record<string, unknown>;

  constructor(
    errorCode: ErrorCodeValue,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.errorCode = errorCode;
    this.httpStatus = ERROR_HTTP_STATUS[errorCode];
    this.details = details;
  }

  toBody() {
    return {
      errorCode: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}
