import dotenv from 'dotenv';
import path from 'path';

// Carga de variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') }); // Por si se ejecuta desde raíz

export const config = {
  port: parseInt(process.env.PORT || process.env.GATEWAY_PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  coreBackendUrl: process.env.CORE_BACKEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://smcta_admin:smcta_secret_password@localhost:5432/smcta_db?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  tenantCacheTtlSeconds: parseInt(process.env.TENANT_CACHE_TTL_SECONDS || '300', 10),
  rootDomain: process.env.ROOT_DOMAIN || 'smcta.local',
};
