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
    currency: 'NGN' as const,
    defaultDeliveryFee: parseFloat(process.env.DEFAULT_DELIVERY_FEE || '0.00'),
    freeShippingThreshold: parseFloat(process.env.SHIPPING_FREE_THRESHOLD || '0.00'),
    orderExpiryMinutes: parseInt(process.env.ORDER_EXPIRY_MINUTES || '30', 10),
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret_key_evys_2026',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_mock_paystack_public_key_evys_2026',
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:5173/checkout/callback',
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'evys-dev-secret-key-change-in-production-min-32-chars',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@evysmedics.co.uk',
    adminPassword: process.env.ADMIN_PASSWORD || 'AdminSecurePass2026!',
  },
};
