import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CheckoutPrimaryUseCase } from '../../../application/use-cases/checkoutPrimaryUseCase.js';

const checkoutSchema = z.object({
  userId: z.string().uuid(),
  nominalPrice: z.number().positive(),
  expirationDate: z.string().datetime().optional().default(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  })
});

export class CheckoutController {
  public static async checkoutPrimary(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = checkoutSchema.parse(req.body);
      const result = await CheckoutPrimaryUseCase.execute({
        tenantId: req.tenant.tenantId,
        userId: validated.userId,
        nominalPrice: validated.nominalPrice,
        expirationDate: validated.expirationDate
      });

      return res.status(201).json({
        message: 'Compra primaria exitosa. Cupón emitido en custodia.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
