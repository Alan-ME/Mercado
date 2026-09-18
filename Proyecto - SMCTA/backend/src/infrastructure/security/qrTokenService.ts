import crypto from 'crypto';
import { QRTokenPayload } from '../../domain/entities/index.js';
import { QRTokenExpiredError } from '../../shared/errors.js';

export class QRTokenService {
  private static readonly TOKEN_TTL_SECONDS = 30;

  private static getSecret(providedSecret?: string): string {
    const secret = providedSecret || process.env.HMAC_SECRET || 'smcta_secret_signing_key_2026';
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('FATAL CONFIG ERROR: HMAC_SECRET debe estar configurada en producción.');
    }
    return secret;
  }

  public static generateToken(params: {
    couponId: string;
    tenantId: string;
    ownerId: string;
    secret?: string;
  }): { tokenString: string; payload: QRTokenPayload; expiresInSeconds: number } {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const secretKey = this.getSecret(params.secret);

    const dataToSign = `${params.couponId}:${params.tenantId}:${params.ownerId}:${nonce}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(dataToSign)
      .digest('hex');

    const payload: QRTokenPayload = {
      couponId: params.couponId,
      tenantId: params.tenantId,
      ownerId: params.ownerId,
      nonce,
      timestamp,
      signature
    };

    const tokenString = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return {
      tokenString,
      payload,
      expiresInSeconds: this.TOKEN_TTL_SECONDS
    };
  }

  public static verifyToken(
    rawToken: string | QRTokenPayload,
    expectedTenantId: string,
    secret?: string
  ): QRTokenPayload {
    let payload: QRTokenPayload;

    if (typeof rawToken === 'string') {
      try {
        const decoded = Buffer.from(rawToken, 'base64url').toString('utf8');
        payload = JSON.parse(decoded);
      } catch (err) {
        throw new QRTokenExpiredError('Formato de token QR inválido o corrupto.');
      }
    } else {
      payload = rawToken;
    }

    if (!payload || typeof payload !== 'object') {
      throw new QRTokenExpiredError('Estructura de token inválida.');
    }

    const { couponId, tenantId, ownerId, nonce, timestamp, signature } = payload;

    if (!couponId || !tenantId || !ownerId || !nonce || !timestamp || !signature) {
      throw new QRTokenExpiredError('Campos obligatorios del token faltantes.');
    }

    if (tenantId !== expectedTenantId) {
      throw new QRTokenExpiredError('El token no pertenece al tenant emisor.');
    }

    const now = Date.now();
    const elapsedSeconds = (now - timestamp) / 1000;
    if (elapsedSeconds > this.TOKEN_TTL_SECONDS || elapsedSeconds < -2) {
      throw new QRTokenExpiredError(
        `El token QR ha expirado (${Math.round(elapsedSeconds)}s transcurridos, máx ${this.TOKEN_TTL_SECONDS}s).`
      );
    }

    const secretKey = this.getSecret(secret);
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(`${couponId}:${tenantId}:${ownerId}:${nonce}:${timestamp}`)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf-8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      throw new QRTokenExpiredError('Firma criptográfica inválida o adulterada.');
    }

    return payload;
  }
}
