import { QRTokenService } from '../../infrastructure/security/qrTokenService.js';
import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { LedgerRepository } from '../../infrastructure/database/ledgerRepository.js';
import { DistributedLockService } from '../../infrastructure/redis/redisClient.js';
import { CouponStateMachine } from '../../domain/state-machine/couponStateMachine.js';
import { Database } from '../../infrastructure/database/db.js';
import { CouponState, LedgerTransactionType } from '../../domain/entities/index.js';
import { NotFoundError } from '../../shared/errors.js';

export class ValidateTPVQRUseCase {
  public static async execute(params: {
    tenantId: string;
    qrTokenString: string;
  }) {
    const payload = QRTokenService.verifyToken(params.qrTokenString, params.tenantId);

    return DistributedLockService.withCouponLock(payload.couponId, async () => {
      const coupon = await CouponRepository.findById(params.tenantId, payload.couponId);
      if (!coupon) {
        throw new NotFoundError(`El cupón '${payload.couponId}' no fue encontrado.`);
      }

      CouponStateMachine.assertInWallet(coupon.state);

      return Database.withTransaction(async (client) => {
        await CouponRepository.updateState(
          params.tenantId,
          coupon.couponId,
          CouponState.CANJEADO,
          client
        );

        const ledger = await LedgerRepository.recordEntry(
          {
            tenantId: params.tenantId,
            couponId: coupon.couponId,
            transactionType: LedgerTransactionType.REDEEM_RELEASE,
            amountInEscrow: coupon.nominalPrice,
            tenantFeeAccumulated: 0.00
          },
          client
        );

        return {
          status: 'SUCCESS',
          couponId: coupon.couponId,
          state: CouponState.CANJEADO,
          nominalPrice: coupon.nominalPrice,
          ledgerId: ledger.ledgerId,
          redeemedAt: new Date().toISOString()
        };
      }, 'SERIALIZABLE');
    });
  }
}
