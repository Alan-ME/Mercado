import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PublishP2POrderUseCase } from '../../../application/use-cases/publishP2POrderUseCase.js';
import { MatchP2POrderUseCase } from '../../../application/use-cases/matchP2POrderUseCase.js';
import { OrderRepository } from '../../database/orderRepository.js';
import { BadRequestError } from '../../../shared/errors.js';

const publishOrderSchema = z.object({
  sellerId: z.string().uuid(),
  couponId: z.string().uuid(),
  askingPrice: z.number().positive()
});

const buyOrderSchema = z.object({
  buyerId: z.string().uuid()
});

export class OrderController {
  public static async publishOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = publishOrderSchema.parse(req.body);
      const order = await PublishP2POrderUseCase.execute({
        tenant: req.tenant,
        sellerId: validated.sellerId,
        couponId: validated.couponId,
        askingPrice: validated.askingPrice
      });

      return res.status(201).json({
        message: 'Orden publicada exitosamente en el mercado P2P.',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listOpenOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await OrderRepository.findOpenOrders(req.tenant.tenantId);
      return res.status(200).json({
        data: orders
      });
    } catch (error) {
      next(error);
    }
  }

  public static async buyOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id;
      const validated = buyOrderSchema.parse(req.body);

      const result = await MatchP2POrderUseCase.execute({
        tenant: req.tenant,
        orderId,
        buyerId: validated.buyerId
      });

      return res.status(200).json({
        message: 'Compra P2P completada exitosamente. Split de comisiones aplicado.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
