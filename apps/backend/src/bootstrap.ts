import type { AppConfig } from './config.js';
import { createDatabase, migrate } from './db/index.js';
import { seedDatabase, type SeedResult } from './db/seed.js';
import {
  InProcessLockManager,
  RedisLockManager,
  type LockManager,
} from './infra/lockManager.js';
import { EventHub } from './infra/eventHub.js';
import { systemClock, type Clock, type ServiceContext } from './services/context.js';

export interface Bootstrapped {
  ctx: ServiceContext;
  seed: SeedResult;
}

export async function bootstrap(
  config: AppConfig,
  withSeed = true,
  clock: Clock = systemClock,
): Promise<Bootstrapped> {
  const db = await createDatabase(config);
  await migrate(db);

  const lockManager: LockManager = config.redisUrl
    ? await RedisLockManager.create(config.redisUrl)
    : new InProcessLockManager();

  const eventHub = new EventHub();
  const ctx: ServiceContext = { db, lockManager, eventHub, clock, config };
  const seed = withSeed ? await seedDatabase(db) : { tenants: [] };
  return { ctx, seed };
}
