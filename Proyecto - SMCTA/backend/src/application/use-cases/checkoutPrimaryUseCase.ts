import crypto from 'crypto';
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
      const couponId = crypto.randomUUID();

      const { tokenString } = QRTokenService.generateToken({
        couponId,
        tenantId: input.tenantId,
        ownerId: input.userId
      });

      const coupon = await CouponRepository.create(
        {
          couponId,
          tenantId: input.tenantId,
          currentOwnerId: input.userId,
          nominalPrice: input.nominalPrice,
          state: CouponState.EN_WALLET,
          qrEncryptedToken: tokenString,
          expirationDate: input.expirationDate
        },
        client
      );

      await LedgerRepository.recordEntry(
        {
          tenantId: input.tenantId,
          couponId,
          transactionType: LedgerTransactionType.CHECKOUT,
          amountInEscrow: input.nominalPrice,
          tenantFeeAccumulated: 0.00
        },
        client
      );

      return { coupon, qrToken: tokenString };
    }, 'SERIALIZABLE');
  }
}

