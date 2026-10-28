import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ErrorCode, ERROR_HTTP_STATUS } from '@smcta/shared';

/**
 * Traduce cualquier error al formato estándar del Protocolo §4:
 *   { errorCode, message, details } + HTTP status canónico.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.httpStatus).send(error.toBody());
      return;
    }

    if (error instanceof ZodError) {
      reply.status(ERROR_HTTP_STATUS[ErrorCode.VALIDATION_ERROR]).send({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Datos de entrada inválidos.',
        details: { issues: error.issues },
      });
      return;
    }

    // Errores de validación de esquema de Fastify.
    if ((error as { validation?: unknown }).validation) {
      reply.status(400).send({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: (error as Error).message,
        details: {},
      });
      return;
    }

    request.log.error({ err: error }, 'Error no controlado');
    reply.status(500).send({
      errorCode: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.',
      details: {},
    });
  });
}
