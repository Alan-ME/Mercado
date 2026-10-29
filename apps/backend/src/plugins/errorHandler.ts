import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ErrorCode, ERROR_HTTP_STATUS } from '@smcta/shared';

// Handler global de excepciones: normaliza cualquier fallo de la aplicación
// al contrato estándar { errorCode, message, details } y le pega el HTTP status canónico.
// Nunca se le escupe al cliente un stack trace crudo de Node ni una página HTML por defecto de Fastify.
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.httpStatus).send(error.toBody());
      return;
    }

    // Errores de validación de Zod en payloads de request (body, query, params)
    if (error instanceof ZodError) {
      reply.status(ERROR_HTTP_STATUS[ErrorCode.VALIDATION_ERROR]).send({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Datos de entrada inválidos.',
        details: { issues: error.issues },
      });
      return;
    }

    // Errores nativos de validación de esquema de Fastify
    if ((error as { validation?: unknown }).validation) {
      reply.status(400).send({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: (error as Error).message,
        details: {},
      });
      return;
    }

    // Fallo imprevisto: registramos el error con detalle en el log del servidor y respondemos 500 limpio
    request.log.error({ err: error }, 'Error no controlado');
    reply.status(500).send({
      errorCode: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.',
      details: {},
    });
  });
}
