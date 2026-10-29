import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AppError, ErrorCode, type QRTokenPayload } from '@smcta/shared';
import { type QrSecret, unwrapQrSecret } from './qrSecret.js';

// Toleramos hasta 5 segundos de desfasaje hacia el futuro por si el servidor NTP del cluster
// anda desfasado con la máquina local. Más de 5s en el futuro es un token trucho queriendo esquivar el TTL.
const MAX_FUTURE_SKEW_MS = 5_000;

type UnsignedPayload = Omit<QRTokenPayload, 'signature'>;

// Si el token trae tokenVersion lo metemos en la cadena canónica; si no viene (clientes
// viejos del protocolo base), mantenemos el formato de 5 partes para no romper compatibilidad.
// OJO: meter tokenVersion acá es vital para neutralizar el ataque boomerang A -> B -> A:
// si Ana le vende el cupón a Beto y Beto se lo revende a Ana dentro de los 30s,
// como el dueño vuelve a ser Ana, sin tokenVersion el QR viejo de Ana seguiría siendo válido.
function canonical(p: UnsignedPayload): string {
  if (p.tokenVersion !== undefined) {
    return [p.couponId, p.tenantId, p.ownerId, String(p.tokenVersion), p.nonce, String(p.timestamp)].join('|');
  }
  return [p.couponId, p.tenantId, p.ownerId, p.nonce, String(p.timestamp)].join('|');
}

function sign(secret: string, p: UnsignedPayload): string {
  return createHmac('sha256', secret).update(canonical(p)).digest('hex');
}

function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64url');
}

function parseTokenPayload(token: string): QRTokenPayload {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    return JSON.parse(raw) as QRTokenPayload;
  } catch {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'Token QR malformado.');
  }
}

// Usamos timingSafeEqual sí o sí: si hacés un === normal entre strings,
// el motor de V8 corta en el primer byte diferente y le regalás un ataque de timing al atacante
// para ir adivinando la firma byte por byte.
function assertValidSignature(secret: string, payload: QRTokenPayload): void {
  const { signature, ...base } = payload;
  const expected = sign(secret, base);
  const sigBuf = Buffer.from(signature ?? '', 'utf-8');
  const expBuf = Buffer.from(expected, 'utf-8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'Firma del token QR inválida.');
  }
}

function assertValidWindow(timestamp: number, ttlMs: number, nowMs: number): void {
  const ageMs = nowMs - timestamp;
  if (ageMs < -MAX_FUTURE_SKEW_MS) {
    throw new AppError(ErrorCode.INVALID_QR_SIGNATURE, 'Timestamp del token QR inválido.');
  }
  if (ageMs > ttlMs) {
    throw new AppError(ErrorCode.QR_TOKEN_EXPIRED, 'El token QR expiró (más de 30 segundos).', {
      ageMs,
    });
  }
}

export function generateQrToken(params: {
  couponId: string;
  tenantId: string;
  ownerId: string;
  secret: QrSecret | string;
  tokenVersion?: number;
  ttlMs?: number;
  nowMs?: number;
}): { token: string; payload: QRTokenPayload; expiresAt: number; ttlMs: number } {
  const ttlMs = params.ttlMs ?? 30_000;
  const timestamp = params.nowMs ?? Date.now();
  const base: UnsignedPayload = {
    couponId: params.couponId,
    tenantId: params.tenantId,
    ownerId: params.ownerId,
    nonce: randomBytes(16).toString('hex'),
    timestamp,
    ...(params.tokenVersion !== undefined ? { tokenVersion: params.tokenVersion } : {}),
  };
  const signature = sign(unwrapQrSecret(params.secret), base);
  const payload: QRTokenPayload = { ...base, signature };
  const token = b64urlEncode(JSON.stringify(payload));
  return { token, payload, expiresAt: timestamp + ttlMs, ttlMs };
}

export function verifyQrToken(
  token: string,
  secret: QrSecret | string,
  ttlMs = 30_000,
  nowMs = Date.now(),
): QRTokenPayload {
  const payload = parseTokenPayload(token);
  assertValidSignature(unwrapQrSecret(secret), payload);
  assertValidWindow(payload.timestamp, ttlMs, nowMs);
  return payload;
}
