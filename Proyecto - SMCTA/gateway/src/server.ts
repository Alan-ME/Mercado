import { createApp } from './app';
import { config } from './config';
import { isPostgresAvailable } from './database/postgres';
import { isRedisAvailable } from './database/redis';

async function startServer(): Promise<void> {
  const app = createApp();

  console.log('='.repeat(60));
  console.log('🚀 Iniciando SMCTA API Gateway (Rol 3)...');
  console.log('='.repeat(60));

  // Verificación no bloqueante de infraestructura
  const [pgOk, redisOk] = await Promise.all([
    isPostgresAvailable(),
    isRedisAvailable(),
  ]);

  console.log(`[PostgreSQL Status]: ${pgOk ? '🟢 Conectado' : '🟡 Offline (Usando Fallback Memory Store)'}`);
  console.log(`[Redis Status]:      ${redisOk ? '🟢 Conectado' : '🟡 Offline (Caché en memoria)'}`);
  console.log(`[Backend Core Dest]: ${config.coreBackendUrl}`);

  app.listen(config.port, () => {
    console.log(`[API Gateway]:      🟢 Escuchando en http://localhost:${config.port}`);
    console.log(`[Health Endpoint]:   http://localhost:${config.port}/health`);
    console.log(`[Tenant Endpoint]:   http://localhost:${config.port}/api/v1/tenant/config`);
    console.log('='.repeat(60));
  });
}

startServer().catch((err) => {
  console.error('Fatal error al iniciar el Gateway:', err);
  process.exit(1);
});
