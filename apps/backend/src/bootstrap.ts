import type { AppConfig } from './config.js';
import { createDatabase, migrate } from './db/index.js';
import { seedDatabase, type SeedResult } from './db/seed.js';
import {
  InProcessLockManager,
  RedisLockManager,
  type LockManager,
} from './infra/lockManager.js';
import type { ServiceContext } from './services/context.js';

export interface Bootstrapped {
  ctx: ServiceContext;
  seed: SeedResult;
}

/** Crea la BD (PGlite/pg), aplica el DDL, siembra datos y arma el contexto de servicios. */
export async function bootstrap(config: AppConfig, withSeed = true): Promise<Bootstrapped> {
  const db = await createDatabase(config);
  await migrate(db);

  const lockManager: LockManager = config.redisUrl
    ? await RedisLockManager.create(config.redisUrl)
    : new InProcessLockManager();

  const ctx: ServiceContext = { db, lockManager, config };
  const seed = withSeed ? await seedDatabase(db) : { tenants: [] };
  return { ctx, seed };
}
