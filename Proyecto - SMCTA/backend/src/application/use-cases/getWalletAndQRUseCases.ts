import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { QRTokenService } from '../../infrastructure/security/qrTokenService.js';
import { CouponStateMachine } from '../../domain/state-machine/couponStateMachine.js';
import { Coupon, QRTokenPayload } from '../../domain/entities/index.js';
import { NotFoundError } from '../../shared/errors.js';

export class GetMyWalletUseCase {
  public static async execute(tenantId: string, userId: string): Promise<Coupon[]> {
    return CouponRepository.findByOwner(tenantId, userId);
  }
}

export class GetQRTokenUseCase {
  public static async execute(params: {
    tenantId: string;
    userId: string;
    couponId: string;
  }): Promise<{ tokenString: string; payload: QRTokenPayload; expiresInSeconds: number }> {
    const coupon = await CouponRepository.findById(params.tenantId, params.couponId);

    if (!coupon) {
      throw new NotFoundError(`El cupón '${params.couponId}' no existe.`);
    }

    if (coupon.currentOwnerId !== params.userId) {
      throw new NotFoundError(`El cupón no pertenece al usuario autenticado.`);
    }

    CouponStateMachine.assertInWallet(coupon.state);

    return QRTokenService.generateToken({
      couponId: coupon.couponId,
      tenantId: params.tenantId,
      ownerId: params.userId
    });
  }
}
