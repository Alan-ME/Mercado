import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://smcta_admin:smcta_secret_password@localhost:5432/smcta_db?schema=public',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export class Database {
  public static async query<T extends pg.QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<pg.QueryResult<T>> {
    return pool.query<T>(text, params);
  }

  public static async withTransaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>,
    isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'SERIALIZABLE',
    maxRetries = 3
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      const client = await pool.connect();

      try {
        await client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error: any) {
        await client.query('ROLLBACK');

        const isSerializationError = error && error.code === '40001';

        if (isSerializationError && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 25 + Math.floor(Math.random() * 50);
          console.warn(`[SERIALIZATION_CONFLICT] Reintentando transacción (intento ${attempt}/${maxRetries}) en ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      } finally {
        client.release();
      }
    }

    throw new Error('Transaction failed after maximum retry attempts');
  }

  public static async close(): Promise<void> {
    await pool.end();
  }
}
