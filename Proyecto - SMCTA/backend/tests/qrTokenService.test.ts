import { describe, it, expect, vi } from 'vitest';
import { QRTokenService } from '../src/infrastructure/security/qrTokenService.js';
import { QRTokenExpiredError } from '../src/shared/errors.js';

describe('QRTokenService (Firma HMAC-SHA256 y TTL de 30 segundos)', () => {
  const couponId = '11111111-2222-3333-4444-555555555555';
  const tenantId = 'tenant-test-001';
  const ownerId = 'user-owner-001';

  it('debe generar un token con estructura válida y TTL de 30s', () => {
    const { tokenString, payload, expiresInSeconds } = QRTokenService.generateToken({
      couponId,
      tenantId,
      ownerId
    });

    expect(expiresInSeconds).toBe(30);
    expect(payload.couponId).toBe(couponId);
    expect(payload.tenantId).toBe(tenantId);
    expect(payload.ownerId).toBe(ownerId);
    expect(payload.signature).toBeDefined();
    expect(tokenString).toBeTypeOf('string');
  });

  it('debe validar exitosamente un token recién emitido', () => {
    const { tokenString } = QRTokenService.generateToken({
      couponId,
      tenantId,
      ownerId
    });

    const verifiedPayload = QRTokenService.verifyToken(tokenString, tenantId);
    expect(verifiedPayload.couponId).toBe(couponId);
    expect(verifiedPayload.ownerId).toBe(ownerId);
  });

  it('debe arrojar QRTokenExpiredError (HTTP 401) si han pasado más de 30 segundos', () => {
    const pastTime = Date.now() - 35000;
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(pastTime);

    const { tokenString } = QRTokenService.generateToken({
      couponId,
      tenantId,
      ownerId
    });

    dateSpy.mockRestore();

    expect(() => {
      QRTokenService.verifyToken(tokenString, tenantId);
    }).toThrowError(QRTokenExpiredError);
  });

  it('debe arrojar QRTokenExpiredError si se intenta verificar con un tenant distinto', () => {
    const { tokenString } = QRTokenService.generateToken({
      couponId,
      tenantId,
      ownerId
    });

    expect(() => {
      QRTokenService.verifyToken(tokenString, 'different-tenant-id');
    }).toThrowError(QRTokenExpiredError);
  });

  it('debe rechazar firmas malformadas o de longitud dispar sin crashear con RangeError', () => {
    const { payload } = QRTokenService.generateToken({
      couponId,
      tenantId,
      ownerId
    });

    const corruptedPayload = { ...payload, signature: 'short_fake_signature' };
    const corruptedTokenString = Buffer.from(JSON.stringify(corruptedPayload)).toString('base64url');

    expect(() => {
      QRTokenService.verifyToken(corruptedTokenString, tenantId);
    }).toThrowError(QRTokenExpiredError);
  });
});
