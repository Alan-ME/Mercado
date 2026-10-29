import { describe, it, expect } from 'vitest';
import { AppError } from '@smcta/shared';
import { generateQrToken, verifyQrToken } from '../domain/qrToken.js';

const base = {
  couponId: '11111111-1111-1111-1111-111111111111',
  tenantId: '22222222-2222-2222-2222-222222222222',
  ownerId: '33333333-3333-3333-3333-333333333333',
  secret: 'super-secret-tenant-key',
};

describe('Tokens QR dinámicos con firma HMAC y TTL', () => {
  it('genera y verifica un token válido', () => {
    const { token } = generateQrToken(base);
    const payload = verifyQrToken(token, base.secret);
    expect(payload.couponId).toBe(base.couponId);
    expect(payload.ownerId).toBe(base.ownerId);
  });

  it('rechaza firma inválida (secreto incorrecto)', () => {
    const { token } = generateQrToken(base);
    expect(() => verifyQrToken(token, 'otro-secreto')).toThrow(AppError);
  });

  it('rechaza token expirado (> 30s) con QR_TOKEN_EXPIRED', () => {
    const { token } = generateQrToken(base);
    try {
      verifyQrToken(token, base.secret, -1); // ttl negativo => siempre expirado
      throw new Error('debió lanzar');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).errorCode).toBe('QR_TOKEN_EXPIRED');
      expect((e as AppError).httpStatus).toBe(401);
    }
  });

  it('rechaza token manipulado', () => {
    const { token } = generateQrToken(base);
    const tampered = token.slice(0, -4) + 'AAAA';
    expect(() => verifyQrToken(tampered, base.secret)).toThrow(AppError);
  });
});
