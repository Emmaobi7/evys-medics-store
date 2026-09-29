import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './connection';
import { config } from '../config/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log(`[DB Migration] Running schema migrations on schema "${config.dbSchema}"...`);
  
  const client = await pool.connect();
  try {
    const schemaSqlPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaSqlPath, 'utf8');
    
    await client.query(`SET search_path TO ${config.dbSchema}, public;`);
    await client.query(`ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) UNIQUE;`);
    await client.query(`ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS stock_restored BOOLEAN NOT NULL DEFAULT FALSE;`);
    await client.query(`ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;`);
    await client.query(sql);

    // Run migration files in migrations directory if present
    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        console.log(`[DB Migration] Running migration ${file}...`);
        const migSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(migSql);
      }
    }
    console.log('[DB Migration] Schema created/verified successfully.');
  } catch (err: any) {
    console.error('[DB Migration Error]:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ESM direct execution check
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('[DB Migration] Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Migration Failed]:', err);
      process.exit(1);
    });
}
