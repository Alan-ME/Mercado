import { describe, it, expect } from 'vitest';
import {
  InProcessLockManager,
  RedisLockManager,
  withLock,
  type LockManager,
} from '../infra/lockManager.js';

// Suite de contrato Liskov: cualquier adaptador de LockManager (memoria o Redis)
// tiene que pasar exactamente las mismas pruebas de exclusión y propiedad de token.
function runLockManagerContractSuite(name: string, factory: () => LockManager): void {
  describe(`Contrato LockManager · ${name}`, () => {
    it('permite un único dueño activo y rechaza intrusos hasta liberar', async () => {
      const lm = factory();
      const t1 = await lm.tryAcquire('lock:coupon:abc', 5_000);
      expect(t1).toBeTruthy();

      const t2 = await lm.tryAcquire('lock:coupon:abc', 5_000);
      expect(t2).toBeNull();

      const released = await lm.release('lock:coupon:abc', t1!);
      expect(released).toBe(true);

      const t3 = await lm.tryAcquire('lock:coupon:abc', 5_000);
      expect(t3).toBeTruthy();
    });

    it('impide que un worker atrasado borre el lock de otro dueño (owner token check)', async () => {
      const lm = factory();
      const expiredOwner = await lm.tryAcquire('lock:coupon:race', 15);
      expect(expiredOwner).toBeTruthy();

      await new Promise((r) => setTimeout(r, 30));

      const newOwner = await lm.tryAcquire('lock:coupon:race', 5_000);
      expect(newOwner).toBeTruthy();

      // El primer worker se despierta tarde e intenta liberar con su token viejo.
      const wrongRelease = await lm.release('lock:coupon:race', expiredOwner!);
      expect(wrongRelease).toBe(false);

      // El lock del segundo dueño tiene que seguir firme.
      const intruder = await lm.tryAcquire('lock:coupon:race', 5_000);
      expect(intruder).toBeNull();
    });

    it('withLock lanza P2P_ORDER_LOCKED (423) ante contención', async () => {
      const lm = factory();
      const held = await lm.tryAcquire('lock:coupon:busy', 5_000);
      expect(held).toBeTruthy();

      await expect(
        withLock(lm, 'lock:coupon:busy', 5_000, async () => 'ok'),
      ).rejects.toMatchObject({ errorCode: 'P2P_ORDER_LOCKED', httpStatus: 423 });
    });
  });
}

// Fake minimalista del cliente Redis que emula SET NX PX y el script Lua de comparación,
// para validar RedisLockManager sin levantar un contenedor en tests unitarios.
function createFakeRedisClient() {
  const store = new Map<string, { val: string; exp: number }>();
  return {
    async set(key: string, val: string, _px: string, ttlMs: number, _nx: string) {
      const cur = store.get(key);
      if (cur && cur.exp > Date.now()) return null;
      store.set(key, { val, exp: Date.now() + ttlMs });
      return 'OK';
    },
    async eval(_script: string, _numKeys: number, key: string, token: string) {
      const cur = store.get(key);
      if (!cur || cur.exp <= Date.now() || cur.val !== token) return 0;
      store.delete(key);
      return 1;
    },
  };
}

runLockManagerContractSuite('InProcessLockManager', () => new InProcessLockManager(4));
runLockManagerContractSuite(
  'RedisLockManager',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => new RedisLockManager(createFakeRedisClient() as any),
);

describe('InProcessLockManager · Evicción de memoria', () => {
  it('desaloja entradas viejas al alcanzar maxEntries sin crecer sin límite', async () => {
    const lm = new InProcessLockManager(2);
    const t1 = await lm.tryAcquire('k1', 5_000);
    const t2 = await lm.tryAcquire('k2', 5_000);
    const t3 = await lm.tryAcquire('k3', 5_000);
    expect(t1).toBeTruthy();
    expect(t2).toBeTruthy();
    expect(t3).toBeTruthy();
    // k1 fue desalojado por capacidad máxima (2), así que k1 está libre de nuevo.
    const t1Again = await lm.tryAcquire('k1', 5_000);
    expect(t1Again).toBeTruthy();
  });
});
