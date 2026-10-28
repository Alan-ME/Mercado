import pg from 'pg';
import {
  type Database,
  type Queryable,
  type QueryResult,
  MAX_SERIALIZABLE_RETRIES,
  SERIALIZATION_FAILURE,
} from './database.js';

const { Pool } = pg;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractSqlState(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  return (err as { code?: string }).code;
}

function shouldRetrySerialization(err: unknown, attempt: number): boolean {
  if (attempt > MAX_SERIALIZABLE_RETRIES) return false;
  return extractSqlState(err) === SERIALIZATION_FAILURE;
}

function backoffMs(attempt: number): number {
  const base = Math.min(20 * 2 ** attempt, 250);
  return base + Math.floor(Math.random() * 15);
}

async function runSingleAttempt<T>(
  pool: pg.Pool,
  fn: (tx: Queryable) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    // Sin timeouts locales, un lock colgado te frena todo el pool de 20 conexiones en cascada.
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL statement_timeout = '5s'");
    const tx: Queryable = {
      async query<T2 = Record<string, unknown>>(sql: string, params: unknown[] = []) {
        const res = await client.query(sql, params);
        return { rows: res.rows as T2[] };
      },
    };
    const result = await fn(tx);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

async function runWithRetry<T>(
  pool: pg.Pool,
  fn: (tx: Queryable) => Promise<T>,
  attempt = 1,
): Promise<T> {
  try {
    return await runSingleAttempt(pool, fn);
  } catch (err) {
    if (!shouldRetrySerialization(err, attempt)) throw err;
    await sleep(backoffMs(attempt));
    return runWithRetry(pool, fn, attempt + 1);
  }
}

export async function createPgDatabase(databaseUrl: string): Promise<Database> {
  const pool = new Pool({ connectionString: databaseUrl, max: 20 });

  return {
    async query<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = [],
    ): Promise<QueryResult<T>> {
      const res = await pool.query(sql, params);
      return { rows: res.rows as T[] };
    },

    async exec(sql: string): Promise<void> {
      await pool.query(sql);
    },

    transactionSerializable<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
      return runWithRetry(pool, fn);
    },

    async close(): Promise<void> {
      await pool.end();
    },
  };
}
