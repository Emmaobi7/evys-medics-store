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
    
    await client.query(sql);
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
