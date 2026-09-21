import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PublishP2POrderUseCase } from '../../../application/use-cases/publishP2POrderUseCase.js';
import { MatchP2POrderUseCase } from '../../../application/use-cases/matchP2POrderUseCase.js';
import { CancelP2POrderUseCase } from '../../../application/use-cases/cancelP2POrderUseCase.js';
import { SimulateQuoteUseCase } from '../../../application/use-cases/simulateQuoteUseCase.js';
import { GetPriceRangeUseCase } from '../../../application/use-cases/getPriceRangeUseCase.js';
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

const cancelOrderSchema = z.object({
  sellerId: z.string().uuid().optional()
});

const simulateQuoteSchema = z.object({
  askingPrice: z.number().positive(),
  nominalPrice: z.number().positive().optional(),
  couponId: z.string().uuid().optional()
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

  public static async listMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || req.userId;
      if (!userId) {
        throw new BadRequestError('Se requiere el parámetro userId en cabecera x-user-id o query.');
      }

      const orders = await OrderRepository.findBySeller(req.tenant.tenantId, userId);
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

  public static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id;
      const sellerId =
        (req.headers['x-user-id'] as string) ||
        req.body?.sellerId ||
        (req.query.sellerId as string) ||
        req.userId;

      if (!sellerId) {
        throw new BadRequestError('Se requiere sellerId en cabecera x-user-id o cuerpo de solicitud.');
      }

      const result = await CancelP2POrderUseCase.execute({
        tenant: req.tenant,
        orderId,
        sellerId
      });

      return res.status(200).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public static async simulateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = simulateQuoteSchema.parse(req.body);
      const result = await SimulateQuoteUseCase.execute({
        tenant: req.tenant,
        askingPrice: validated.askingPrice,
        nominalPrice: validated.nominalPrice,
        couponId: validated.couponId
      });

      return res.status(200).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getPriceRange(req: Request, res: Response, next: NextFunction) {
    try {
      const couponId = req.params.couponId;
      const result = await GetPriceRangeUseCase.execute({
        tenant: req.tenant,
        couponId
      });

      return res.status(200).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

