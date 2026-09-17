import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidateTPVQRUseCase } from '../../../application/use-cases/validateTPVQRUseCase.js';

const tpvSchema = z.object({
  qrToken: z.string().min(1)
});

export class TPVController {
  public static async validateQR(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = tpvSchema.parse(req.body);
      const result = await ValidateTPVQRUseCase.execute({
        tenantId: req.tenant.tenantId,
        qrTokenString: validated.qrToken
      });

      return res.status(200).json({
        message: 'Canje confirmado. Cupón redimido y fondos de Escrow liberados al comercio.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
