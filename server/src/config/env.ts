import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  dbSchema: process.env.DB_SCHEMA || 'evys',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((o) => o.trim()),
  commerce: {
    freeShippingThreshold: parseFloat(process.env.SHIPPING_FREE_THRESHOLD || '50.00'),
    standardShippingRate: parseFloat(process.env.SHIPPING_STANDARD_RATE || '4.95'),
    defaultVatRate: parseFloat(process.env.DEFAULT_VAT_RATE || '0.20'),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'evys-dev-secret-key-change-in-production-min-32-chars',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@evysmedics.co.uk',
    adminPassword: process.env.ADMIN_PASSWORD || 'AdminSecurePass2026!',
  },
};
