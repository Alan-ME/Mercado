import type { AppConfig } from '../config.js';
import type { Database } from '../db/database.js';
import type { LockManager } from '../infra/lockManager.js';

/** Dependencias inyectadas a los servicios de dominio. */
export interface ServiceContext {
  db: Database;
  lockManager: LockManager;
  config: AppConfig;
}
