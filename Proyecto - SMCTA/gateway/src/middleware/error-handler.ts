import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Gateway Unhandled Error]', err);

  const errorResponse: ApiErrorResponse = {
    errorCode: 'INTERNAL_GATEWAY_ERROR',
    message: err.message || 'Error no controlado en el API Gateway.',
  };

  res.status(500).json(errorResponse);
}
