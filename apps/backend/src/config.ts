import { fileURLToPath } from 'node:url';

/** Configuración por entorno. Valores por defecto listos para F5 sin setup externo. */
export interface AppConfig {
  port: number;
  host: string;
  /** Si se define, se usa PostgreSQL en red (pg). Si no, PGlite embebido en proceso. */
  databaseUrl: string | undefined;
  /** Si se define, se usa Redis real (ioredis) para los locks. Si no, lock en proceso. */
  redisUrl: string | undefined;
  /** Ruta al build estático del frontend (se sirve si existe). */
  webDistPath: string;
  /** TTL del token QR en milisegundos (TASK-003: 30 segundos exactos). */
  qrTtlMs: number;
  /** TTL del lock de cupón en ms (Hoja Rol 1: 5 segundos). */
  lockTtlMs: number;
  logLevel: string;
}

function num(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function loadConfig(): AppConfig {
  return {
    port: num(process.env.PORT, 8080),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    // fileURLToPath decodifica correctamente rutas con espacios (%20) y letra de unidad.
    webDistPath:
      process.env.WEB_DIST_PATH ?? fileURLToPath(new URL('../../web/dist', import.meta.url)),
    qrTtlMs: num(process.env.QR_TTL_MS, 30_000),
    lockTtlMs: num(process.env.LOCK_TTL_MS, 5_000),
    logLevel: process.env.LOG_LEVEL ?? 'info',
  };
}
