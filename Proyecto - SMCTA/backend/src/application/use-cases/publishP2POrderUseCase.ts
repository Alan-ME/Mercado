import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { OrderRepository } from '../../infrastructure/database/orderRepository.js';
import { DistributedLockService } from '../../infrastructure/redis/redisClient.js';
import { PriceCollarCalculator } from '../../domain/calculators/priceCollarCalculator.js';
import { CouponStateMachine } from '../../domain/state-machine/couponStateMachine.js';
import { Database } from '../../infrastructure/database/db.js';
import { CouponState, OrderSide, OrderStatus, P2POrder, TenantConfig } from '../../domain/entities/index.js';
import { BadRequestError, DailyResaleLimitReachedError, NotFoundError } from '../../shared/errors.js';

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

      if (tenant.closureHoursBeforeEvent && coupon.expirationDate) {
        const cutoffMs = new Date(coupon.expirationDate).getTime() - (tenant.closureHoursBeforeEvent * 3600 * 1000);
        if (Date.now() >= cutoffMs) {
          throw new BadRequestError(
            `La ventana de comercialización para este evento ha cerrado (${tenant.closureHoursBeforeEvent}h antes del evento/vencimiento).`
          );
        }
      }

      PriceCollarCalculator.validate(
        askingPrice,
        coupon.nominalPrice,
        tenant.priceFloorPct,
        tenant.priceCeilingPct
      );

      return Database.withTransaction(async (client) => {
        const lockedCoupon = await CouponRepository.findById(tenant.tenantId, couponId, client, true);
        if (!lockedCoupon || lockedCoupon.state !== CouponState.EN_WALLET) {
          throw new BadRequestError('El cupón ya no se encuentra disponible para publicación.');
        }

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

