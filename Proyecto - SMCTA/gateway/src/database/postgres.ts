import { Pool } from 'pg';
import { config } from '../config';

let poolInstance: Pool | null = null;
let isConnected = false;

export function getPostgresPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    poolInstance.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]', err.message);
      isConnected = false;
    });
  }
  return poolInstance;
}

export async function isPostgresAvailable(): Promise<boolean> {
  try {
    const pool = getPostgresPool();
    const res = await pool.query('SELECT 1');
    isConnected = res.rowCount === 1;
    return isConnected;
  } catch {
    isConnected = false;
    return false;
  }
}
