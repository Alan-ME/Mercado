import Redis from 'ioredis';
import { config } from '../config';

let redisInstance: Redis | null = null;
let isRedisConnected = false;

export function getRedisClient(): Redis | null {
  if (!redisInstance) {
    try {
      redisInstance = new Redis(config.redisUrl, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // No reintentar indefinidamente si está apagado
      });

      redisInstance.on('connect', () => {
        isRedisConnected = true;
      });

      redisInstance.on('error', (err) => {
        isRedisConnected = false;
        // Registro silencioso/warning para no ensuciar stdout si no hay Redis local
      });
    } catch {
      redisInstance = null;
    }
  }
  return redisInstance;
}

export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  try {
    if (client.status === 'wait') {
      await client.connect();
    }
    const pong = await client.ping();
    isRedisConnected = pong === 'PONG';
    return isRedisConnected;
  } catch {
    isRedisConnected = false;
    return false;
  }
}
