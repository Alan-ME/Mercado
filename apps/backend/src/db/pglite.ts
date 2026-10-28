import { PGlite } from '@electric-sql/pglite';
import {
  type Database,
  type Queryable,
  type QueryResult,
  MAX_SERIALIZABLE_RETRIES,
  SERIALIZATION_FAILURE,
} from './database.js';

/**
 * Adaptador PostgreSQL embebido (WASM) — motor Postgres real en proceso.
 * Cero dependencias externas: permite ejecutar el proyecto con F5 sin Docker.
 * El mismo DDL/SQL corre idéntico contra un Postgres en red (ver pg.ts).
 *
 * PGlite mantiene UNA sola conexión, por lo que las transacciones se serializan
 * mediante una cola interna (no puede haber dos transacciones abiertas a la vez).
 */
export class PGliteDatabase implements Database {
  private readonly pg: PGlite;
  private txChain: Promise<unknown> = Promise.resolve();

  constructor() {
    this.pg = new PGlite();
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    const res = await this.pg.query<T>(sql, params);
    return { rows: res.rows };
  }

  async exec(sql: string): Promise<void> {
    await this.pg.exec(sql);
  }

  async transactionSerializable<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
    // Encadena para garantizar exclusión mutua sobre la única conexión.
    const run = this.txChain.then(() => this.runTx(fn));
    // Evita que un rechazo rompa la cadena para las siguientes transacciones.
    this.txChain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async runTx<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt++;
      try {
        await this.pg.exec('BEGIN ISOLATION LEVEL SERIALIZABLE;');
        const result = await fn(this);
        await this.pg.exec('COMMIT;');
        return result;
      } catch (err) {
        await this.pg.exec('ROLLBACK;').catch(() => undefined);
        if (isSerializationFailure(err) && attempt <= MAX_SERIALIZABLE_RETRIES) {
          continue;
        }
        throw err;
      }
    }
  }

  async close(): Promise<void> {
    await this.pg.close();
  }
}

function isSerializationFailure(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === SERIALIZATION_FAILURE
  );
}
