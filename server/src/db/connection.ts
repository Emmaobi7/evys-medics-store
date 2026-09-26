import pg from 'pg';
import { config } from '../config/env';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('sslmode=require') || config.nodeEnv === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${config.dbSchema}, public;`);
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

export async function getClient() {
  const client = await pool.connect();
  await client.query(`SET search_path TO ${config.dbSchema}, public;`);
  return client;
}
