import { AppError, ErrorCode } from '@smcta/shared';

/**
 * Lock distribuido para prevenir race conditions / double-spending (TASK-005).
 * Esquema de clave del documento: `lock:coupon:{coupon_id}` con TTL de 5s.
 *
 * Por defecto: implementación en proceso (atómica en el event-loop de Node),
 * suficiente para un backend de instancia única y para la prueba de concurrencia QA-02.
 * Con REDIS_URL se conmuta a un lock distribuido real (SET NX PX) para multi-instancia.
 */
export interface LockManager {
  tryAcquire(key: string, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

export function couponLockKey(couponId: string): string {
  return `lock:coupon:${couponId}`;
}

/** Lock en memoria. El check-and-set es síncrono => atómico frente a concurrencia. */
export class InProcessLockManager implements LockManager {
  private readonly held = new Map<string, number>();

  async tryAcquire(key: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const expiry = this.held.get(key);
    if (expiry !== undefined && expiry > now) {
      return false;
    }
    this.held.set(key, now + ttlMs);
    return true;
  }

  async release(key: string): Promise<void> {
    this.held.delete(key);
  }
}

/** Lock distribuido sobre Redis (activado con REDIS_URL). */
export class RedisLockManager implements LockManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly redis: any) {}

  static async create(redisUrl: string): Promise<RedisLockManager> {
    // 'ioredis' es dependencia OPCIONAL (el lock por defecto es en proceso).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mod: any;
    try {
      mod = await import('ioredis' as string);
    } catch {
      throw new Error(
        "REDIS_URL está definido pero 'ioredis' no está instalado. Ejecutá: npm i ioredis",
      );
    }
    const IORedis = mod.default ?? mod;
    return new RedisLockManager(new IORedis(redisUrl));
  }

  async tryAcquire(key: string, ttlMs: number): Promise<boolean> {
    const res = await this.redis.set(key, '1', 'PX', ttlMs, 'NX');
    return res === 'OK';
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

/**
 * Ejecuta `fn` bajo el lock `key`. Si no puede adquirirlo (otro proceso lo tiene),
 * lanza P2P_ORDER_LOCKED (HTTP 423) — el perdedor de la carrera.
 */
export async function withLock<T>(
  lockManager: LockManager,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const acquired = await lockManager.tryAcquire(key, ttlMs);
  if (!acquired) {
    throw new AppError(
      ErrorCode.P2P_ORDER_LOCKED,
      'La orden está siendo procesada por otra operación concurrente. Intentá nuevamente.',
      { lockKey: key },
    );
  }
  try {
    return await fn();
  } finally {
    await lockManager.release(key);
  }
}
