-- Migration 003: Stock Restoration & Order Safety Architecture
SET search_path TO evys, public;

-- 1. Add stock_restored and expires_at columns to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'evys' AND table_name = 'orders' AND column_name = 'stock_restored'
  ) THEN
    ALTER TABLE orders ADD COLUMN stock_restored BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'evys' AND table_name = 'orders' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Indexes for efficient lookup of abandoned and expiring orders
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON orders(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stock_restored ON orders(stock_restored);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);
