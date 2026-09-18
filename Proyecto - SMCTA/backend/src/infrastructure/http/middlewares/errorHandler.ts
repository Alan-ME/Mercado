import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors.js';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      errorCode: 'VALIDATION_ERROR',
      message: 'Parámetros de entrada inválidos o faltantes.',
      details: err.flatten().fieldErrors
    });
  }

  if ((err as any).code === '40001') {
    return res.status(423).json({
      errorCode: 'P2P_ORDER_LOCKED',
      message: 'Conflicto de concurrencia detectado. La transacción fue abortada para garantizar la consistencia.',
      details: {}
    });
  }

  console.error('[UNHANDLED ERROR]', err);
  return res.status(500).json({
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Ha ocurrido un error interno en el servidor.',
    details: process.env.NODE_ENV === 'development' ? { stack: err.stack, raw: err.message } : {}
  });
};
