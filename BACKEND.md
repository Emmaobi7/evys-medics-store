# EVYS Medical — Backend & Database Architecture

This document details the backend, database, and authentication implementation for the **EVYS Medical** platform.

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |     EVYS Medical Frontend   |
                      |  (React + TypeScript + Vite)|
                      +--------------+--------------+
                                     |
                                     | REST (JSON / Bearer JWT / CORS)
                                     v
                      +-----------------------------+
                      |   Express TypeScript API    |
                      |  (Auth, Validation, Guard)  |
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
* **Authentication**: Password hashing with `bcrypt` (12 rounds) and signed JSON Web Tokens (`HS256`, 24h expiration).
* **Authorization**: Role-based access control with `requireAuth` and `requireAdmin` middlewares protecting all administrative routes.
* **Validation**: Zod schema validation on request payloads and query parameters.
* **Security & Reliability**: Row-locking transaction checkouts, constant-time password verification, decoupled server-authoritative calculations, and sanitized error responses that never leak database details.

---

## 2. Database Schema (`evys`)

The database is normalized to ensure data integrity and easy bulk catalog importing:

1. **`users`**:
   * Stores authenticated administrative and customer accounts.
   * Fields: `id`, `email` (unique, indexed), `password_hash`, `role` (`'ADMIN'` | `'CUSTOMER'`), `created_at`, `updated_at`.
2. **`categories`**:
   * Supports a 2-tier hierarchy (Departments and Subcategories) via `parent_id`.
   * Fields: `id`, `name`, `slug`, `description`, `image_url`, `parent_id`, `sort_order`, `is_active`, timestamps.
3. **`products`**:
   * Core product record with authoritative ex-VAT pricing.
   * Fields: `id`, `sku`, `name`, `slug`, `category_id`, `subcategory_id`, `brand`, `short_description`, `description`, `product_type`, `price_ex_vat`, `compare_at_price_ex_vat`, `vat_rate`, `lead_time`, `is_active`, `is_featured`, timestamps.
4. **`product_images`**:
   * 1-to-many normalized image gallery with `sort_order` and `alt_text`.
5. **`product_features`**:
   * 1-to-many bullet points for clinical feature highlights.
6. **`product_specifications`**:
   * 1-to-many technical specification key-value pairs.
7. **`inventory`**:
   * 1-to-1 authoritative stock counts with `stock_count` and `track_inventory` flags.
8. **`orders`**:
   * Order header storing customer contact, shipping address, financial totals, status, and payment method.
9. **`order_items`**:
   * Immutable historical snapshot of line items (`sku_snapshot`, `product_name_snapshot`, `unit_price_ex_vat`, `quantity`, `vat_rate`, `line_total_ex_vat`).

---

## 3. API Endpoints

### System
* `GET /api/health` — Service health check & environment info.

### Authentication & Authorization
* `POST /api/v1/auth/login` — Authenticate user and receive signed JWT token.
  * Request: `{ "email": "...", "password": "..." }`
  * Response (200): `{ "token": "...", "user": { "id": "...", "email": "...", "role": "ADMIN" } }`
* `GET /api/v1/auth/me` *(Protected: `requireAuth`)* — Retrieve current authenticated user profile.

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

### Admin Operations *(Protected: `requireAuth` + `requireAdmin`)*
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
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
DB_SCHEMA=evys
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@evysmedics.co.uk
ADMIN_PASSWORD=YourAdminPassword
SHIPPING_FREE_THRESHOLD=50.00
SHIPPING_STANDARD_RATE=4.95
DEFAULT_VAT_RATE=0.20
```

### 3. Run Database Migrations
Applies or verifies all tables, relations, indexes, and the `users` table:
```bash
npm run db:migrate
```

### 4. Seed Development Data
* **Catalog Data**:
  ```bash
  npm run db:seed
  ```
* **Development Admin & Test Users**:
  ```bash
  npm run db:seed:admin
  ```

### 5. Start the Server
* **API Server (auto-reloads on file changes)**:
  ```bash
  npm run server
  ```
* **Frontend Application**:
  ```bash
  npm run dev
  ```

### 6. Run Authentication Tests
Executes the automated authentication test suite against the running server:
```bash
npm run test:auth
```

---

## 5. Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | API server listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `DB_SCHEMA` | Isolated PostgreSQL schema name | `evys` |
| `JWT_SECRET` | Secret key used to sign authentication tokens | `your-secure-random-jwt-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | Token expiration lifespan | `24h` |
| `ADMIN_EMAIL` | Bootstrap admin email address | `admin@evysmedics.co.uk` |
| `ADMIN_PASSWORD` | Bootstrap admin initial password | `YourAdminPassword` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173,http://localhost:5174` |
| `SHIPPING_FREE_THRESHOLD`| Order subtotal threshold for free UK courier delivery | `50.00` |
| `SHIPPING_STANDARD_RATE` | Standard delivery fee under threshold | `4.95` |
| `DEFAULT_VAT_RATE` | Standard UK VAT rate | `0.20` |

---

## 6. How Future Product Import Should Work

When the client provides their real product catalogue (e.g. CSV, Excel, or ERP XML):
1. **Catalog Import Script**: A dedicated import script can parse CSV columns (`SKU`, `Name`, `Category`, `Subcategory`, `Brand`, `PriceExVAT`, `Stock`, `Specs`).
2. **Schema Compatibility**: Because the database schema is fully normalized and decoupled from mock data arrays, importing real products requires **zero changes** to the database architecture or API contracts.
3. **Idempotent Upsert**: Products can be updated by matching on unique `sku` without breaking existing order item historical snapshots.

---

## 7. Intentionally NOT Implemented in this Pass

In accordance with project scope:
* **Stripe & Live Payment Processing**: Payment status transitions default to `invoice_pending` / `po_verified` without third-party card tokenization.
* **Automated Email Dispatch**: Order confirmations and invoices are recorded in the database without external SMTP/SES triggers.
* **Customer Registration & Checkout Auth Gates**: Guest checkout remains open for instant purchases while administrative endpoints are strictly protected by JWT auth.
* **Advanced B2B Pricing Tiers**: Custom per-clinic discount schedules and NHS credit limits await client contract specifications.
