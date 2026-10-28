import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { AppError, ErrorCode } from '@smcta/shared';

export interface LockManager {
  tryAcquire(key: string, ttlMs: number): Promise<string | null>;
  release(key: string, ownerToken: string): Promise<boolean>;
}

export function couponLockKey(couponId: string): string {
  return `lock:coupon:${couponId}`;
}

interface LockEntry {
  token: string;
  expiresAt: number;
}

// Sin cota superior ni barrido de expirados, cada cupón único que pase por el servidor
// deja basura en el Map hasta que explote el heap de Node.
export class InProcessLockManager implements LockManager {
  private readonly held = new Map<string, LockEntry>();
  private readonly maxEntries: number;

  constructor(maxEntries = 5_000) {
    this.maxEntries = maxEntries;
  }

  async tryAcquire(key: string, ttlMs: number): Promise<string | null> {
    const now = Date.now();
    const existing = this.held.get(key);
    if (existing && existing.expiresAt > now) {
      return null;
    }
    this.evictIfNeeded(now);
    const token = randomUUID();
    this.held.set(key, { token, expiresAt: now + ttlMs });
    return token;
  }

  async release(key: string, ownerToken: string): Promise<boolean> {
    const existing = this.held.get(key);
    if (!existing || existing.token !== ownerToken) {
      return false;
    }
    this.held.delete(key);
    return true;
  }

  private evictIfNeeded(now: number): void {
    if (this.held.size < this.maxEntries) return;
    this.purgeExpired(now);
    if (this.held.size < this.maxEntries) return;
    const oldestKey = this.held.keys().next().value;
    if (oldestKey !== undefined) this.held.delete(oldestKey);
  }

  private purgeExpired(now: number): void {
    for (const [k, v] of this.held) {
      if (v.expiresAt <= now) this.held.delete(k);
    }
  }
}

// Si hacés DEL a secas cuando expira el TTL porque el worker se colgó, le volás el lock
// al proceso que entró legítimamente detrás tuyo. El script Lua compara dueño y borra atómico.
const RELEASE_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export class RedisLockManager implements LockManager {
  constructor(private readonly redis: Redis) {}

  static async create(redisUrl: string): Promise<RedisLockManager> {
    const client = new Redis(redisUrl, { maxRetriesPerRequest: 2 });
    return new RedisLockManager(client);
  }

  async tryAcquire(key: string, ttlMs: number): Promise<string | null> {
    const token = randomUUID();
    const res = await this.redis.set(key, token, 'PX', ttlMs, 'NX');
    return res === 'OK' ? token : null;
  }

  async release(key: string, ownerToken: string): Promise<boolean> {
    const res = await this.redis.eval(RELEASE_LUA, 1, key, ownerToken);
    return res === 1;
  }
}

export async function withLock<T>(
  lockManager: LockManager,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const ownerToken = await lockManager.tryAcquire(key, ttlMs);
  if (!ownerToken) {
    throw new AppError(
      ErrorCode.P2P_ORDER_LOCKED,
      'La orden está siendo procesada por otra operación concurrente. Intentá nuevamente.',
      { lockKey: key },
    );
  }
  try {
    return await fn();
  } finally {
    await lockManager.release(key, ownerToken);
  }
}
