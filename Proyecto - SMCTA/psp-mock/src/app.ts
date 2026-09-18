import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import paymentRouter from './routes/payment.routes';
import escrowRouter from './routes/escrow.routes';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Healthcheck
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'smcta-psp-mock',
      timestamp: new Date().toISOString(),
    });
  });

  // Rutas de simulación PSP
  app.use('/psp/payments', paymentRouter);
  app.use('/psp/escrow', escrowRouter);

  // Manejador 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Ruta no encontrada en el Simulador PSP.',
    });
  });

  return app;
}
