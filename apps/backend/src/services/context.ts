import type { Database } from '../db/database.js';
import type { LockManager } from '../infra/lockManager.js';
import type { EventHub } from '../infra/eventHub.js';
import type { AppConfig } from '../config.js';

export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

export interface ServiceContext {
  db: Database;
  lockManager: LockManager;
  eventHub: EventHub;
  clock: Clock;
  config: AppConfig;
}
