/** Puerto de persistencia (hexagonal). Adaptadores: PGlite embebido y Postgres en red. */

export interface QueryResult<T> {
  rows: T[];
}

export interface Queryable {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface Database extends Queryable {
  /** Ejecuta uno o varios statements SQL (para migraciones). */
  exec(sql: string): Promise<void>;
  /**
   * Ejecuta `fn` dentro de una transacción con aislamiento SERIALIZABLE.
   * Si dos matches P2P colisionan sobre el mismo registro, Postgres aborta uno
   * con serialization_failure (SQLSTATE 40001); reintentamos con backoff exponencial.
   */
  transactionSerializable<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export const SERIALIZATION_FAILURE = '40001';
export const MAX_SERIALIZABLE_RETRIES = 5;
