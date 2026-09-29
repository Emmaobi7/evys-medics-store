-- EVYS Medical PostgreSQL Database Schema
-- Schema: evys

CREATE SCHEMA IF NOT EXISTS evys;
SET search_path TO evys, public;

-- 1. Categories Table (Hierarchical: Parent Departments & Subcategories)
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table (Core Normalized Catalog)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  brand VARCHAR(128) NOT NULL,
  short_description TEXT,
  description TEXT,
  product_type VARCHAR(128),
  price_ex_vat NUMERIC(10, 2) NOT NULL CHECK (price_ex_vat >= 0),
  compare_at_price_ex_vat NUMERIC(10, 2) CHECK (compare_at_price_ex_vat >= 0),
  vat_rate NUMERIC(4, 2) DEFAULT 0.20 CHECK (vat_rate >= 0),
  lead_time VARCHAR(128) DEFAULT 'Standard Courier Dispatch',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Images (Normalized One-to-Many)
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT DEFAULT 0
);

-- 4. Product Features (Bullet Points)
CREATE TABLE IF NOT EXISTS product_features (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- 5. Product Specifications (Key-Value Technical Table)
CREATE TABLE IF NOT EXISTS product_specifications (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- 6. Inventory Table (Authoritative Stock Levels)
CREATE TABLE IF NOT EXISTS inventory (
  product_id VARCHAR(64) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  stock_count INT NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  track_inventory BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders Table (Purchasing & Dispatch Record)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, confirmed, processing, ready, dispatched, delivered, cancelled
  payment_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
  payment_method VARCHAR(32) NOT NULL DEFAULT 'paystack', -- paystack, card, bank_transfer, invoice
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(64) NOT NULL,
  clinic_name VARCHAR(255),
  po_number VARCHAR(128),
  shipping_address_line1 TEXT NOT NULL,
  shipping_city VARCHAR(128) NOT NULL,
  shipping_postcode VARCHAR(32) NOT NULL,
  shipping_country VARCHAR(64) DEFAULT 'Nigeria',
  subtotal_ex_vat NUMERIC(12, 2) NOT NULL CHECK (subtotal_ex_vat >= 0),
  shipping_ex_vat NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_ex_vat >= 0),
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
  vat_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (vat_total >= 0),
  grand_total_inc_vat NUMERIC(12, 2) NOT NULL CHECK (grand_total_inc_vat >= 0),
  currency VARCHAR(8) DEFAULT 'NGN',
  idempotency_key VARCHAR(128) UNIQUE,
  stock_restored BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Items Table (Immutable Historical Snapshot of Line Items)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  sku_snapshot VARCHAR(64) NOT NULL,
  product_name_snapshot VARCHAR(255) NOT NULL,
  unit_price_ex_vat NUMERIC(12, 2) NOT NULL CHECK (unit_price_ex_vat >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  vat_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
  line_total_ex_vat NUMERIC(12, 2) NOT NULL CHECK (line_total_ex_vat >= 0)
);

-- 9. Payments Table (Paystack Transactions & Provider Records)
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

-- 10. Users Table (Admin & Customer Authentication)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER', -- 'ADMIN', 'CUSTOMER'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Fast Querying & Filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_ex_vat);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
