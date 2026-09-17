import { OrderRepository } from '../../infrastructure/database/orderRepository.js';
import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { LedgerRepository } from '../../infrastructure/database/ledgerRepository.js';
import { DistributedLockService } from '../../infrastructure/redis/redisClient.js';
import { FeeCalculator } from '../../domain/calculators/feeCalculator.js';
import { QRTokenService } from '../../infrastructure/security/qrTokenService.js';
import { Database } from '../../infrastructure/database/db.js';
import { CouponState, LedgerTransactionType, OrderStatus, TenantConfig } from '../../domain/entities/index.js';
import { BadRequestError, NotFoundError, P2POrderLockedError } from '../../shared/errors.js';

export interface MatchP2POrderInput {
  tenant: TenantConfig;
  orderId: string;
  buyerId: string;
}

export class MatchP2POrderUseCase {
  public static async execute(input: MatchP2POrderInput) {
    const { tenant, orderId, buyerId } = input;

    const order = await OrderRepository.findById(tenant.tenantId, orderId);
    if (!order) {
      throw new NotFoundError(`La orden P2P '${orderId}' no existe.`);
    }

    if (order.status !== OrderStatus.OPEN) {
      throw new P2POrderLockedError(`La orden ya ha sido completada o cancelada.`);
    }

    if (order.sellerId === buyerId) {
      throw new BadRequestError(`No puedes comprar tu propia orden publicada.`);
    }

    return DistributedLockService.withCouponLock(order.couponId, async () => {
      return Database.withTransaction(async (client) => {
        const currentOrder = await OrderRepository.findById(tenant.tenantId, orderId, client);
        if (!currentOrder || currentOrder.status !== OrderStatus.OPEN) {
          throw new P2POrderLockedError(`La orden ya no está disponible para compra.`);
        }

        const coupon = await CouponRepository.findById(tenant.tenantId, order.couponId, client);
        if (!coupon || coupon.state !== CouponState.PUBLICADO_P2P) {
          throw new P2POrderLockedError(`El cupón ya no está disponible para venta P2P.`);
        }

        const breakdown = FeeCalculator.calculateBreakdown({
          nominalPrice: coupon.nominalPrice,
          askingPrice: currentOrder.askingPrice,
          sellerTakeRatePct: tenant.sellerTakeRatePct,
          buyerTakeRatePct: tenant.buyerTakeRatePct,
          platformRevenueSharePct: tenant.platformRevenueSharePct
        });

        const { tokenString } = QRTokenService.generateToken({
          couponId: coupon.couponId,
          tenantId: tenant.tenantId,
          ownerId: buyerId
        });

        await OrderRepository.updateStatus(tenant.tenantId, orderId, OrderStatus.MATCHED, client);

        await CouponRepository.transferOwnership(
          tenant.tenantId,
          coupon.couponId,
          buyerId,
          CouponState.EN_WALLET,
          tokenString,
          client
        );

        await LedgerRepository.recordEntry(
          {
            tenantId: tenant.tenantId,
            couponId: coupon.couponId,
            transactionType: LedgerTransactionType.P2P_SPLIT,
            amountInEscrow: breakdown.totalBuyerPrice,
            tenantFeeAccumulated: breakdown.tenantRetainedFee
          },
          client
        );

        return {
          orderId: currentOrder.orderId,
          couponId: coupon.couponId,
          buyerId,
          sellerId: currentOrder.sellerId,
          status: OrderStatus.MATCHED,
          commissionBreakdown: breakdown,
          newQrToken: tokenString
        };
      }, 'SERIALIZABLE');
    });
  }
}
