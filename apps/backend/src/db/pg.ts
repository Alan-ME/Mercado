import {
  type Database,
  type Queryable,
  type QueryResult,
  MAX_SERIALIZABLE_RETRIES,
  SERIALIZATION_FAILURE,
} from './database.js';

/**
 * Adaptador PostgreSQL en red (paquete `pg`), activado con DATABASE_URL.
 * Es la ruta "documentada" (PostgreSQL 15+ gestionado). Import dinámico para
 * que el proyecto no requiera `pg` instalado en el arranque por defecto (PGlite).
 */
export async function createPgDatabase(databaseUrl: string): Promise<Database> {
  // Import dinámico con especificador no literal: 'pg' es dependencia OPCIONAL,
  // no se resuelve en tiempo de compilación (el arranque por defecto usa PGlite).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pgModule: any;
  try {
    pgModule = await import('pg' as string);
  } catch {
    throw new Error(
      "DATABASE_URL está definido pero el paquete 'pg' no está instalado. Ejecutá: npm i pg",
    );
  }
  const PgPool = pgModule.Pool ?? pgModule.default?.Pool;
  const pool = new PgPool({ connectionString: databaseUrl, max: 20 });

  const db: Database = {
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

    async transactionSerializable<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
      let attempt = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        attempt++;
        const client = await pool.connect();
        try {
          await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
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
          if (
            typeof err === 'object' &&
            err !== null &&
            (err as { code?: string }).code === SERIALIZATION_FAILURE &&
            attempt <= MAX_SERIALIZABLE_RETRIES
          ) {
            continue;
          }
          throw err;
        } finally {
          client.release();
        }
      }
    },

    async close(): Promise<void> {
      await pool.end();
    },
  };

  return db;
}
