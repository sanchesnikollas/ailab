import pg from 'pg';
import Redis from 'ioredis';

const { Pool } = pg;

// PostgreSQL connection pool
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://ialab:ialab_password@localhost:5432/ialab',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis client
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    await client.query('SELECT 1');
    client.release();

    await redis.ping();

    return true;
  } catch {
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnections(): Promise<void> {
  await pgPool.end();
  await redis.quit();
}
