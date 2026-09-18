import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { OrderRepository } from '../../infrastructure/database/orderRepository.js';
import { DistributedLockService } from '../../infrastructure/redis/redisClient.js';
import { PriceCollarCalculator } from '../../domain/calculators/priceCollarCalculator.js';
import { CouponStateMachine } from '../../domain/state-machine/couponStateMachine.js';
import { Database } from '../../infrastructure/database/db.js';
import { CouponState, OrderSide, OrderStatus, P2POrder, TenantConfig } from '../../domain/entities/index.js';
import { DailyResaleLimitReachedError, NotFoundError } from '../../shared/errors.js';

export interface PublishP2POrderInput {
  tenant: TenantConfig;
  sellerId: string;
  couponId: string;
  askingPrice: number;
}

export class PublishP2POrderUseCase {
  public static async execute(input: PublishP2POrderInput): Promise<P2POrder> {
    const { tenant, sellerId, couponId, askingPrice } = input;

    const dailyCount = await CouponRepository.countDailyResalesByUser(tenant.tenantId, sellerId);
    if (dailyCount >= tenant.maxDailyResalesPerUser) {
      throw new DailyResaleLimitReachedError(
        `Has alcanzado el límite máximo de ${tenant.maxDailyResalesPerUser} publicaciones P2P por día.`
      );
    }

    return DistributedLockService.withCouponLock(couponId, async () => {
      const coupon = await CouponRepository.findById(tenant.tenantId, couponId);
      if (!coupon) {
        throw new NotFoundError(`El cupón '${couponId}' no existe.`);
      }

      if (coupon.currentOwnerId !== sellerId) {
        throw new NotFoundError(`El cupón no pertenece al usuario autenticado.`);
      }

      CouponStateMachine.assertInWallet(coupon.state);

      PriceCollarCalculator.validate(
        askingPrice,
        coupon.nominalPrice,
        tenant.priceFloorPct,
        tenant.priceCeilingPct
      );

      return Database.withTransaction(async (client) => {
        await CouponRepository.updateState(
          tenant.tenantId,
          couponId,
          CouponState.PUBLICADO_P2P,
          client
        );

        const order = await OrderRepository.create(
          {
            tenantId: tenant.tenantId,
            couponId,
            sellerId,
            askingPrice,
            side: OrderSide.SELL,
            status: OrderStatus.OPEN
          },
          client
        );

        return order;
      }, 'SERIALIZABLE');
    });
  }
}
