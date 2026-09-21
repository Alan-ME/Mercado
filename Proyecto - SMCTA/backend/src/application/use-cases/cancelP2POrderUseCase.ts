import { OrderRepository } from '../../infrastructure/database/orderRepository.js';
import { CouponRepository } from '../../infrastructure/database/couponRepository.js';
import { DistributedLockService } from '../../infrastructure/redis/redisClient.js';
import { Database } from '../../infrastructure/database/db.js';
import { CouponState, OrderStatus, TenantConfig } from '../../domain/entities/index.js';
import { BadRequestError, NotFoundError, P2POrderLockedError } from '../../shared/errors.js';

export interface CancelP2POrderInput {
  tenant: TenantConfig;
  orderId: string;
  sellerId: string;
}

export class CancelP2POrderUseCase {
  public static async execute(input: CancelP2POrderInput) {
    const { tenant, orderId, sellerId } = input;

    const order = await OrderRepository.findById(tenant.tenantId, orderId);
    if (!order) {
      throw new NotFoundError(`La orden P2P '${orderId}' no existe.`);
    }

    if (order.sellerId !== sellerId) {
      throw new BadRequestError(`No tienes permisos para cancelar una orden que no te pertenece.`);
    }

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestError(`Solo se pueden cancelar órdenes en estado OPEN (estado actual: ${order.status}).`);
    }

    return DistributedLockService.withCouponLock(order.couponId, async () => {
      return Database.withTransaction(async (client) => {
        const currentOrder = await OrderRepository.findById(tenant.tenantId, orderId, client, true);
        if (!currentOrder || currentOrder.status !== OrderStatus.OPEN) {
          throw new P2POrderLockedError(`La orden ya no está disponible para cancelación.`);
        }

        const coupon = await CouponRepository.findById(tenant.tenantId, order.couponId, client, true);
        if (!coupon || coupon.state !== CouponState.PUBLICADO_P2P) {
          throw new P2POrderLockedError(`El cupón ya no se encuentra en estado PUBLICADO_P2P.`);
        }

        await OrderRepository.updateStatus(tenant.tenantId, orderId, OrderStatus.CANCELLED, client);
        await CouponRepository.updateState(tenant.tenantId, order.couponId, CouponState.EN_WALLET, client);

        return {
          orderId,
          couponId: order.couponId,
          status: OrderStatus.CANCELLED,
          couponState: CouponState.EN_WALLET,
          message: 'Orden cancelada exitosamente. El cupón ha retornado a tu billetera.'
        };
      }, 'SERIALIZABLE');
    });
  }
}
