import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AppError, ErrorCode, type QRTokenPayload } from '@smcta/shared';

/**
 * Token QR dinámico anti-captura (TASK-003 / US-02).
 * - nonce aleatorio + timestamp por generación.
 * - firma HMAC-SHA256 con la clave secreta del tenant.
 * - expira a los `ttlMs` (30s exactos) => QR_TOKEN_EXPIRED (401).
 * - firma inválida => INVALID_QR_SIGNATURE (401).
 *
 * Formato de token: base64url(JSON.stringify(payloadConFirma)).
 */

function canonical(p: Omit<QRTokenPayload, 'signature'>): string {
  return [p.couponId, p.tenantId, p.ownerId, p.nonce, String(p.timestamp)].join('|');
}

function sign(secret: string, p: Omit<QRTokenPayload, 'signature'>): string {
  return createHmac('sha256', secret).update(canonical(p)).digest('hex');
}

function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64url');
}

function b64urlDecode(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf-8');
}

export function generateQrToken(params: {
  couponId: string;
  tenantId: string;
  ownerId: string;
  secret: string;
}): { token: string; payload: QRTokenPayload; expiresAt: number; ttlMs: number } {
  const ttlMs = 30_000;
  const base: Omit<QRTokenPayload, 'signature'> = {
    couponId: params.couponId,
    tenantId: params.tenantId,
    ownerId: params.ownerId,
    nonce: randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  };
  const signature = sign(params.secret, base);
  const payload: QRTokenPayload = { ...base, signature };
  const token = b64urlEncode(JSON.stringify(payload));
  return { token, payload, expiresAt: base.timestamp + ttlMs, ttlMs };
}

export function verifyQrToken(
  token: string,
  secret: string,
  ttlMs = 30_000,
): QRTokenPayload {
  let payload: QRTokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(token)) as QRTokenPayload;
  } catch {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'Token QR malformado.');
  }

  const { signature, ...base } = payload;
  const expected = sign(secret, base);
  const sigBuf = Buffer.from(signature ?? '', 'utf-8');
  const expBuf = Buffer.from(expected, 'utf-8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'Firma del token QR inválida.');
  }

  if (Date.now() - payload.timestamp > ttlMs) {
    throw new AppError(ErrorCode.QR_TOKEN_EXPIRED, 'El token QR expiró (más de 30 segundos).', {
      ageMs: Date.now() - payload.timestamp,
    });
  }

  return payload;
}
