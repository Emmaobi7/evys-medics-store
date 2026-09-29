/**
 * Evy's Projects — Standalone Order Expiry Worker Script
 *
 * Scans for unpaid pending orders older than their expiration window
 * and releases reserved inventory idempotently using cancelOrderAndRestoreStock.
 *
 * Usage:
 *   npx tsx server/src/scripts/expireOrders.ts
 *   npm run orders:expire
 *
 * Production deployment: Run via system cron (e.g., every 10 or 15 minutes) or platform scheduler.
 */

import { expirePendingOrders } from '../services/orderService';
import { pool } from '../db/connection';

async function main() {
  console.log(`[Order Expiry Worker] Starting scan at ${new Date().toISOString()}...`);
  try {
    const result = await expirePendingOrders();
    console.log(
      `[Order Expiry Worker] Completed. Expired ${result.expiredCount} order(s), restored ${result.restoredItemsCount} inventory item(s).`
    );
    if (result.expiredOrderNumbers.length > 0) {
      console.log(`[Order Expiry Worker] Expired orders: ${result.expiredOrderNumbers.join(', ')}`);
    }
  } catch (error: any) {
    console.error('[Order Expiry Worker Failed]:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
