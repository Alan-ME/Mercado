import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from '../config.js';
import type { Database } from './database.js';
import { PGliteDatabase } from './pglite.js';
import { createPgDatabase } from './pg.js';

const SCHEMA_PATH = fileURLToPath(new URL('./schema.sql', import.meta.url));

export async function createDatabase(config: AppConfig): Promise<Database> {
  if (config.databaseUrl) {
    return createPgDatabase(config.databaseUrl);
  }
  return new PGliteDatabase();
}

/** Aplica el DDL. En PGlite (memoria) corre en cada arranque sobre BD limpia. */
export async function migrate(db: Database): Promise<void> {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  await db.exec(schema);
}

export type { Database } from './database.js';
