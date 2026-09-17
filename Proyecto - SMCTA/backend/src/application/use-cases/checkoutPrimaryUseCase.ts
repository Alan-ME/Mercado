import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { LedgerRepository } from '../../infrastructure/database/ledgerRepository.js';
import { QRTokenService } from '../../infrastructure/security/qrTokenService.js';
import { Coupon, CouponState, LedgerTransactionType } from '../../domain/entities/index.js';
import { Database } from '../../infrastructure/database/db.js';

export interface CheckoutPrimaryInput {
  tenantId: string;
  userId: string;
  nominalPrice: number;
  expirationDate: string;
}

export class CheckoutPrimaryUseCase {
  public static async execute(input: CheckoutPrimaryInput): Promise<{ coupon: Coupon; qrToken: string }> {
    return Database.withTransaction(async (client) => {
      const tempToken = 'pending_initial_token';
      const coupon = await CouponRepository.create(
        {
          tenantId: input.tenantId,
          currentOwnerId: input.userId,
          nominalPrice: input.nominalPrice,
          state: CouponState.EN_WALLET,
          qrEncryptedToken: tempToken,
          expirationDate: input.expirationDate
        },
        client
      );

      const { tokenString } = QRTokenService.generateToken({
        couponId: coupon.couponId,
        tenantId: input.tenantId,
        ownerId: input.userId
      });

      await LedgerRepository.recordEntry(
        {
          tenantId: input.tenantId,
          couponId: coupon.couponId,
          transactionType: LedgerTransactionType.CHECKOUT,
          amountInEscrow: input.nominalPrice,
          tenantFeeAccumulated: 0.00
        },
        client
      );

      coupon.qrEncryptedToken = tokenString;
      return { coupon, qrToken: tokenString };
    }, 'SERIALIZABLE');
  }
}
