export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      errorCode: this.errorCode,
      message: this.message,
      details: this.details || {}
    };
  }
}

export class PriceCollarViolationError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'PRICE_COLLAR_VIOLATION';
  constructor(message = 'Precio fuera del rango permitido por el Price Collar del Tenant', details?: Record<string, any>) {
    super(message, details);
  }
}

export class CouponNotInWalletError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'COUPON_NOT_IN_WALLET';
  constructor(message = 'El cupón no se encuentra en estado EN_WALLET para realizar esta acción', details?: Record<string, any>) {
    super(message, details);
  }
}

export class P2POrderLockedError extends AppError {
  readonly statusCode = 423;
  readonly errorCode = 'P2P_ORDER_LOCKED';
  constructor(message = 'Orden en proceso de match concurrente o bloqueada temporalmente', details?: Record<string, any>) {
    super(message, details);
  }
}

export class DailyResaleLimitReachedError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'DAILY_RESALE_LIMIT_REACHED';
  constructor(message = 'El usuario ha superado el límite diario de reventas parametrizado', details?: Record<string, any>) {
    super(message, details);
  }
}

export class QRTokenExpiredError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'QR_TOKEN_EXPIRED';
  constructor(message = 'El token criptográfico QR ha expirado o su firma es inválida', details?: Record<string, any>) {
    super(message, details);
  }
}

export class TenantNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'TENANT_NOT_FOUND';
  constructor(message = 'Tenant no encontrado o inactivo', details?: Record<string, any>) {
    super(message, details);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
  constructor(message = 'Recurso no encontrado', details?: Record<string, any>) {
    super(message, details);
  }
}

export class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'BAD_REQUEST';
  constructor(message = 'Solicitud inválida o parámetros incorrectos', details?: Record<string, any>) {
    super(message, details);
  }
}
