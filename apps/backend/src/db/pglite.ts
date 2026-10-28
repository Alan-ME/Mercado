import { PGlite } from '@electric-sql/pglite';
import {
  type Database,
  type Queryable,
  type QueryResult,
  MAX_SERIALIZABLE_RETRIES,
  SERIALIZATION_FAILURE,
} from './database.js';

// PGlite corre sobre UNA única conexión en proceso. Si dejás que query() entre libre
// mientras otra promesa está a mitad de un BEGIN..COMMIT, las consultas ajenas se cuelan
// adentro de esa transacción y cualquier error te aborta el bloque del vecino.
// Por eso encolamos todo acceso externo en mutexChain, y adentro de runTx pasamos un
// handle directo (`rawQueryable`) para no auto-bloquearnos esperando nuestra propia cola.
export class PGliteDatabase implements Database {
  private readonly pg: PGlite;
  private mutexChain: Promise<unknown> = Promise.resolve();
  private readonly rawQueryable: Queryable;

  constructor() {
    this.pg = new PGlite();
    this.rawQueryable = {
      query: async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => {
        const res = await this.pg.query<T>(sql, params);
        return { rows: res.rows };
      },
    };
  }

  query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.enqueue(() => this.rawQueryable.query<T>(sql, params));
  }

  exec(sql: string): Promise<void> {
    return this.enqueue(async () => {
      await this.pg.exec(sql);
    });
  }

  transactionSerializable<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
    return this.enqueue(() => this.runTx(fn));
  }

  async close(): Promise<void> {
    await this.enqueue(() => this.pg.close());
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.mutexChain.then(task);
    this.mutexChain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async runTx<T>(fn: (tx: Queryable) => Promise<T>, attempt = 1): Promise<T> {
    try {
      await this.pg.exec('BEGIN ISOLATION LEVEL SERIALIZABLE;');
      const result = await fn(this.rawQueryable);
      await this.pg.exec('COMMIT;');
      return result;
    } catch (err) {
      await this.pg.exec('ROLLBACK;').catch(() => undefined);
      if (shouldRetrySerialization(err, attempt)) {
        return this.runTx(fn, attempt + 1);
      }
      throw err;
    }
  }
}

function extractSqlState(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  return (err as { code?: string }).code;
}

function shouldRetrySerialization(err: unknown, attempt: number): boolean {
  if (attempt > MAX_SERIALIZABLE_RETRIES) return false;
  return extractSqlState(err) === SERIALIZATION_FAILURE;
}
