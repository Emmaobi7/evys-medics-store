import { getClient } from './connection';
import { config } from '../config/env';
import { hashPassword } from '../utils/auth';

export async function seedAdminUsers() {
  console.log(`[Auth Seed] Seeding development users into schema "${config.dbSchema}"...`);
  console.log('[Auth Seed] NOTE: For DEVELOPMENT & TESTING purposes only.');

  const client = await getClient();

  try {
    const adminEmail = config.auth.adminEmail.toLowerCase().trim();
    const adminPassword = config.auth.adminPassword;
    const adminHash = await hashPassword(adminPassword);

    // 1. Upsert Bootstrap Admin User
    await client.query(
      `
      INSERT INTO users (id, email, password_hash, role)
      VALUES ($1, $2, $3, 'ADMIN')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'ADMIN',
        updated_at = NOW();
      `,
      ['usr_admin_bootstrap', adminEmail, adminHash]
    );
    console.log(`[Auth Seed] ✓ Admin user ready: ${adminEmail} (Role: ADMIN)`);

    // 2. Upsert Development Test Customer User (for role-based 403 tests)
    const customerEmail = 'customer@clinic.co.uk';
    const customerPassword = 'CustomerPass2026!';
    const customerHash = await hashPassword(customerPassword);

    await client.query(
      `
      INSERT INTO users (id, email, password_hash, role)
      VALUES ($1, $2, $3, 'CUSTOMER')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'CUSTOMER',
        updated_at = NOW();
      `,
      ['usr_customer_demo', customerEmail, customerHash]
    );
    console.log(`[Auth Seed] ✓ Test customer ready: ${customerEmail} (Role: CUSTOMER)`);

    console.log('[Auth Seed] Users seed completed successfully.');
  } catch (err: any) {
    console.error('[Auth Seed Error]:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ESM direct execution check
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.ts')) {
  seedAdminUsers()
    .then(() => {
      console.log('[Auth Seed] Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Auth Seed Failed]:', err);
      process.exit(1);
    });
}
