const INSPECT = Symbol.for('nodejs.util.inspect.custom');

// Value Object opaco para la clave HMAC del tenant.
// Si dejás qr_secret como string pelado en request.tenant, tarde o temprano alguien
// mete un logger.info(request.tenant) o un JSON.stringify y regalás la llave de firma en los logs.
export class QrSecret {
  readonly #value: string;

  private constructor(raw: string) {
    this.#value = raw;
  }

  static fromRaw(raw: string): QrSecret {
    if (!raw || raw.trim().length === 0) {
      throw new Error('qr_secret vacío al hidratar Tenant.');
    }
    return new QrSecret(raw);
  }

  toString(): string {
    return '[REDACTED_QR_SECRET]';
  }

  toJSON(): string {
    return '[REDACTED_QR_SECRET]';
  }

  [INSPECT](): string {
    return '[REDACTED_QR_SECRET]';
  }

  // Única vía de escape autorizada: el firmador HMAC de tokens QR.
  unsafeUnwrap(): string {
    return this.#value;
  }
}

export function unwrapQrSecret(secret: QrSecret | string): string {
  return secret instanceof QrSecret ? secret.unsafeUnwrap() : secret;
}
