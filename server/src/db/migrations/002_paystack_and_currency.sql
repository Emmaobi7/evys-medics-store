-- Migration 002: Paystack Payments, Modular NGN Currency & Tax-Inclusive Orders
SET search_path TO evys, public;

-- 1. Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL DEFAULT 'paystack',
  provider_reference VARCHAR(128) UNIQUE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
  payment_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 2. Update default currency on orders table to NGN
ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'NGN';
UPDATE orders SET currency = 'NGN' WHERE currency = 'GBP' OR currency IS NULL;

-- 3. Ensure delivery fee and tax-inclusive fields exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'evys' AND table_name = 'orders' AND column_name = 'delivery_fee'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0);
  END IF;
END $$;
