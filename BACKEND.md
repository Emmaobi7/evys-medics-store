# EVYS Medical — Backend & Database Architecture

This document details the backend and database implementation for the **EVYS Medical** platform.

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |     EVYS Medical Frontend   |
                      |  (React + TypeScript + Vite)|
                      +--------------+--------------+
                                     |
                                     | REST (JSON / CORS)
                                     v
                      +-----------------------------+
                      |   Express TypeScript API    |
                      | (Validation, Error Handling)|
                      +--------------+--------------+
                                     |
                                     | Connection Pool (pg)
                                     v
                      +-----------------------------+
                      |   PostgreSQL 17 (Neon)      |
                      |       (Schema: evys)        |
                      +-----------------------------+
```

* **Runtime & Framework**: Node.js v20+ with TypeScript and Express.
* **Database**: PostgreSQL 17 (hosted on Neon AWS `eu-west-2`) utilizing dedicated schema `evys`.
* **Validation**: Zod schema validation on request payloads and query parameters.
* **Security & Reliability**: Transaction-safe checkout with row-level locks, decoupled server-authoritative pricing/stock calculations, and sanitized error responses that prevent raw database leakages.

---

## 2. Database Schema (`evys`)

The database is normalized to ensure data integrity and easy bulk catalog importing:

1. **`categories`**:
   * Supports a 2-tier hierarchy (Departments and Subcategories) via `parent_id`.
   * Fields: `id`, `name`, `slug`, `description`, `image_url`, `parent_id`, `sort_order`, `is_active`, timestamps.
2. **`products`**:
   * Core product record with authoritative ex-VAT pricing.
   * Fields: `id`, `sku`, `name`, `slug`, `category_id`, `subcategory_id`, `brand`, `short_description`, `description`, `product_type`, `price_ex_vat`, `compare_at_price_ex_vat`, `vat_rate`, `lead_time`, `is_active`, `is_featured`, timestamps.
3. **`product_images`**:
   * 1-to-many normalized image gallery with `sort_order` and `alt_text`.
4. **`product_features`**:
   * 1-to-many bullet points for clinical feature highlights.
5. **`product_specifications`**:
   * 1-to-many technical specification key-value pairs.
6. **`inventory`**:
   * 1-to-1 authoritative stock counts with `stock_count` and `track_inventory` flags.
7. **`orders`**:
   * Order header storing customer contact, shipping address, financial totals, status, and payment method.
8. **`order_items`**:
   * Immutable historical snapshot of line items (`sku_snapshot`, `product_name_snapshot`, `unit_price_ex_vat`, `quantity`, `vat_rate`, `line_total_ex_vat`).

---

## 3. API Endpoints

### System
* `GET /api/health` — Service health check & environment info.

### Categories & Navigation
* `GET /api/v1/categories` — List active parent categories with live aggregated product counts.
* `GET /api/v1/categories/tree` — Complete department and subcategory tree for the Mega Menu.

### Products & Search
* `GET /api/v1/products` — Filterable catalogue with pagination and facets.
  * Query parameters: `q`, `category`, `subcategory`, `brand`, `product_type`, `min_price`, `max_price`, `in_stock`, `sort`, `page`, `limit`.
* `GET /api/v1/products/:slug` — Full Product Detail record with specifications, gallery, features, and inventory.
* `GET /api/v1/products/:id/related` — 4 related products from the same category.
* `GET /api/v1/search/suggest?q={query}` — High-speed search dropdown suggestions (max 6 products + matching categories).
* `POST /api/v1/products/quick-lookup` — Single and batch SKU resolution for Quick Order modal.

### Cart & Orders
* `POST /api/v1/cart/validate` — Server-authoritative recalculation of prices, inventory availability, UK VAT, and shipping threshold rules.
* `POST /api/v1/orders` — Transaction-safe order placement with inventory reservation, price snapshotting, and human-readable order number generation (`EVS-ORD-YYYY-XXXXXX`).
* `GET /api/v1/orders/:id` — Retrieve order receipt and line item snapshots.

### Admin Operations
* `GET /api/v1/admin/products` — List all products (active & inactive) with inventory levels.
* `POST /api/v1/admin/products` — Create new product with images, specifications, and initial stock.
* `PATCH /api/v1/admin/products/:id/stock` — Direct stock level update.
* `PATCH /api/v1/admin/products/:id/price` — Direct price & promotional compare-price update.
* `DELETE /api/v1/admin/products/:id` — Archive / deactivate product.
* `GET /api/v1/admin/orders` — List orders with optional `?status=` filtering.
* `PATCH /api/v1/admin/orders/:id/status` — Update order status and payment verification status.

---

## 4. How to Run Locally

### Prerequisites
* Node.js v20+
* npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Ensure `.env` exists in the project root:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:...@ep-...eu-west-2.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-...
DB_SCHEMA=evys
SHIPPING_FREE_THRESHOLD=50.00
SHIPPING_STANDARD_RATE=4.95
DEFAULT_VAT_RATE=0.20
```

### 3. Run Database Migrations
Creates or updates all tables, relations, and indices:
```bash
npm run db:migrate
```

### 4. Seed Development Data
Populates categories, subcategories, products, images, specs, and inventory from the development mock dataset:
```bash
npm run db:seed
```

### 5. Start the Server
* **Development (auto-reload)**:
  ```bash
  npm run server
  ```
* **Frontend Development**:
  ```bash
  npm run dev
  ```

---

## 5. Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | API server listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `DB_SCHEMA` | Isolated PostgreSQL schema name | `evys` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173,http://localhost:5174` |
| `SHIPPING_FREE_THRESHOLD`| Order subtotal threshold for free UK courier delivery | `50.00` |
| `SHIPPING_STANDARD_RATE` | Standard delivery fee under threshold | `4.95` |
| `DEFAULT_VAT_RATE` | Standard UK VAT rate | `0.20` |

---

## 6. How Seed Data Works

* The script in `server/src/db/seed.ts` reads initial category and product definitions from `src/data/categories.ts` and `src/data/products.ts`.
* It inserts hierarchical categories (linking subcategories to parent departments via `parent_id`), normalizes product galleries into `product_images`, specifications into `product_specifications`, features into `product_features`, and seeds stock into `inventory`.
* **Important**: This seed data is explicitly labeled as **DEVELOPMENT / DEMO DATA ONLY**.

---

## 7. How Future Product Import Should Work

When the client provides their real product catalogue (e.g. CSV, Excel, or ERP XML):
1. **Catalog Import Script**: A dedicated import script can parse CSV columns (`SKU`, `Name`, `Category`, `Subcategory`, `Brand`, `PriceExVAT`, `Stock`, `Specs JSON/columns`).
2. **Schema Compatibility**: Because the database schema is fully normalized and decoupled from mock data arrays, importing real products requires **zero changes** to the database architecture or API contracts.
3. **Idempotent Upsert**: Products can be updated by matching on unique `sku` without breaking existing order item historical snapshots.

---

## 8. Intentionally NOT Implemented in this Phase

In accordance with project scope:
* **Stripe & Live Payment Processing**: Payment status transitions default to `invoice_pending` / `po_verified` without third-party card tokenization.
* **Automated Email Dispatch**: Order confirmations and invoices are recorded in the database without external SMTP/SES triggers.
* **Customer Authentication & Sessions**: JWT / session cookies for practitioner login are structured in the data contract but not enforced on guest checkout.
* **Advanced B2B Pricing Tiers**: Custom per-clinic discount schedules and NHS credit limits await client contract specifications.
