import { Redis } from 'ioredis';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { P2POrderLockedError } from '../../shared/errors.js';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 100, 2000);
  },
  lazyConnect: true
});

let isRedisConnected = false;

redis.on('connect', () => {
  isRedisConnected = true;
});

redis.on('error', () => {
  isRedisConnected = false;
});

class InMemoryLockManager {
  private static locks = new Map<string, { lockId: string; expiresAt: number }>();

  public static acquire(key: string, ttlMs: number): string | null {
    const now = Date.now();
    const existing = this.locks.get(key);

    if (existing && existing.expiresAt > now) {
      return null;
    }

    const lockId = crypto.randomUUID();
    this.locks.set(key, { lockId, expiresAt: now + ttlMs });
    return lockId;
  }

  public static release(key: string, lockId: string): boolean {
    const existing = this.locks.get(key);
    if (existing && existing.lockId === lockId) {
      this.locks.delete(key);
      return true;
    }
    return false;
  }
}

export class DistributedLockService {
  private static readonly RELEASE_LUA_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  public static async acquireLock(
    key: string,
    ttlMs = 5000
  ): Promise<string | null> {
    const lockId = crypto.randomUUID();

    try {
      if (isRedisConnected || redis.status === 'ready') {
        const result = await redis.set(key, lockId, 'PX', ttlMs, 'NX');
        return result === 'OK' ? lockId : null;
      }
    } catch (err) {
      console.error(`[LOCK-ERROR] Fallo de conexión con Redis en clave ${key}:`, err);
    }

    if (process.env.NODE_ENV === 'production') {
      console.error(`[CRITICAL] Operación rechazada por indisponibilidad de Redis en producción.`);
      return null;
    }

    return InMemoryLockManager.acquire(key, ttlMs);
  }

  public static async releaseLock(key: string, lockId: string): Promise<boolean> {
    try {
      if (isRedisConnected || redis.status === 'ready') {
        const result = await redis.eval(
          this.RELEASE_LUA_SCRIPT,
          1,
          key,
          lockId
        );
        return result === 1;
      }
    } catch (err) {
    }

    return InMemoryLockManager.release(key, lockId);
  }

  public static async withCouponLock<T>(
    couponId: string,
    action: () => Promise<T>,
    ttlMs = 5000
  ): Promise<T> {
    const lockKey = `lock:coupon:${couponId}`;
    const lockId = await this.acquireLock(lockKey, ttlMs);

    if (!lockId) {
      throw new P2POrderLockedError(
        `El cupón '${couponId}' está bloqueado por una operación concurrente en curso.`
      );
    }

    try {
      return await action();
    } finally {
      await this.releaseLock(lockKey, lockId);
    }
  }
}
