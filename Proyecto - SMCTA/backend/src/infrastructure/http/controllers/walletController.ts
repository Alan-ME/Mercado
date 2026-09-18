import { Request, Response, NextFunction } from 'express';
import { GetMyWalletUseCase, GetQRTokenUseCase } from '../../../application/use-cases/getWalletAndQRUseCases.js';
import { BadRequestError } from '../../../shared/errors.js';

export class WalletController {
  public static async getMyWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.query.userId as string) || req.userId;
      if (!userId) {
        throw new BadRequestError('Se requiere el parámetro userId en cabecera o query.');
      }

      const coupons = await GetMyWalletUseCase.execute(req.tenant.tenantId, userId);
      return res.status(200).json({
        data: coupons
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getQRToken(req: Request, res: Response, next: NextFunction) {
    try {
      const couponId = req.params.id;
      const userId = (req.query.userId as string) || req.userId;

      if (!userId) {
        throw new BadRequestError('Se requiere el parámetro userId en cabecera o query para verificar propiedad.');
      }

      const result = await GetQRTokenUseCase.execute({
        tenantId: req.tenant.tenantId,
        userId,
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
