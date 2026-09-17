import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { tenantResolverMiddleware } from './middleware/tenant-resolver';
import { errorHandler } from './middleware/error-handler';
import tenantRouter from './routes/tenant.routes';
import { backendCoreProxy } from './routes/proxy.routes';

export function createApp(): Express {
  const app = express();

  // 1. Middlewares Globales
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  }));

  // Ruta pública de Healthcheck (exenta de tenant)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'smcta-api-gateway',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Middleware de Contexto y Resolución Multi-Tenant
  app.use(tenantResolverMiddleware);

  // 3. Rutas locales del Gateway (Configuración del Tenant para Rol 2 y Admin B2B)
  app.use('/api/v1/tenant', express.json(), tenantRouter);
  app.use('/api/v1/admin/tenant', express.json(), tenantRouter);

  // 4. Proxy Inverso para el resto de rutas /api/v1/* hacia Backend Core (Rol 1)
  // Nota: Dejamos pasar el stream al proxy sin consumir el body antes con express.json() para multipart/raw
  app.use('/api/v1', backendCoreProxy);

  // 5. Manejador para endpoints no encontrados en el Gateway
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      errorCode: 'ROUTE_NOT_FOUND',
      message: 'La ruta solicitada no existe en el API Gateway.',
    });
  });

  // 6. Manejador centralizado de errores
  app.use(errorHandler);

  return app;
}
