import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './infrastructure/http/routes/index.js';
import { errorHandler } from './infrastructure/http/middlewares/errorHandler.js';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());
app.use(router);
app.use(errorHandler);

const PORT = process.env.CORE_BACKEND_PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 [SMCTA-CORE] Backend Core escuchando en el puerto ${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}
