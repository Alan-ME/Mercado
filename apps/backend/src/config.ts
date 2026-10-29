import { fileURLToPath } from 'node:url';

export interface AppConfig {
  port: number;
  host: string;
  databaseUrl: string | undefined;
  redisUrl: string | undefined;
  webDistPath: string;
  qrTtlMs: number;
  lockTtlMs: number;
  logLevel: string;
  corsOrigins: string[];
  enableDevRoutes: boolean;
  pspWebhookSecret: string | undefined;
}

function num(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

// Si no definen CORS_ORIGINS en el entorno, permitimos únicamente el loopback local en los puertos
// habituales de desarrollo (Vite en 5173 y Fastify en 8080).
function parseOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Las rutas /dev/* exponen usuarios y cupones para el selector visual de la demo.
// En producción (NODE_ENV=production) se apagan automáticamente salvo que alguien fuerce ENABLE_DEV_ROUTES=true.
function resolveDevRoutesFlag(env: NodeJS.ProcessEnv): boolean {
  if (env.ENABLE_DEV_ROUTES !== undefined) {
    return env.ENABLE_DEV_ROUTES === 'true';
  }
  return env.NODE_ENV !== 'production';
}

export function loadConfig(): AppConfig {
  return {
    port: num(process.env.PORT, 8080),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    webDistPath:
      process.env.WEB_DIST_PATH ?? fileURLToPath(new URL('../../web/dist', import.meta.url)),
    qrTtlMs: num(process.env.QR_TTL_MS, 30_000),
    lockTtlMs: num(process.env.LOCK_TTL_MS, 5_000),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
    enableDevRoutes: resolveDevRoutesFlag(process.env),
    pspWebhookSecret: process.env.PSP_WEBHOOK_SECRET,
  };
}
