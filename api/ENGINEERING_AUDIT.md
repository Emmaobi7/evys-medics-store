# Backend Preparation & Engineering Audit: EVYS Medical

This document provides an engineering audit of the EVYS Medical frontend codebase to establish the exact data contracts, validation boundaries, and API surfaces needed for backend integration.

---

## 1. Product Contract

### Fields and Types

| Field Name | Type | UI Necessity | Example | Where Used in UI |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | `"med-001"` | Cart state, keys, quick order, routing, lookup |
| `sku` | `string` | **Required** | `"EVS-AUT-018"` | Product cards, PDP hero, Quick Order lookup, Cart lines, Search |
| `name` | `string` | **Required** | `"Digital Benchtop Autoclave 18L"` | All cards, Search suggestions, PDP title, Cart item, Checkout |
| `slug` | `string` | **Required** | `"digital-benchtop-autoclave-18l"` | URL routing, breadcrumbs, sharing |
| `category` | `MainCategory` (`string`) | **Required** | `"medical-equipment"` | Mega menu routing, Shop filtering, Breadcrumbs |
| `categoryName` | `string` | **Required** | `"Medical Equipment"` | Badge display, Breadcrumb text, Search match |
| `subcategory` | `string` | Optional | `"sterilisation"` | Filter bar, deep navigation, related products |
| `subcategoryName` | `string` | Optional | `"Sterilisation & Autoclaves"` | Secondary breadcrumb label, filter pills |
| `productType` | `string` | Optional | `"Autoclaves"` | Faceted search / category filter sidebar |
| `price` | `number` (GBP £) | **Required** | `1850.00` | Ex-VAT display, Cart calculations, Sort by price |
| `compareAtPrice` | `number` | Optional | `2100.00` | Strikethrough pricing for promotional discounts |
| `rating` | `number` (0–5) | Optional | `4.9` | Star rating display on cards and PDP |
| `reviewCount` | `number` | Optional | `18` | Rating count next to stars on cards and PDP |
| `badge` | `enum` (`'Bestseller' \| 'Popular' \| 'New' \| 'ISO Certified' \| 'Standard'`) | Optional | `"ISO Certified"` | Product card visual pill, badge filter |
| `shortDescription`| `string` | **Required** | `"Class B autoclave engineered for clinical sterilization..."` | Product cards, Search preview, PDP summary snippet |
| `description` | `string[]` | **Required** | `["Paragraph 1...", "Paragraph 2..."]` | PDP Product Information body paragraphs |
| `features` | `string[]` | **Required** | `["18L chamber capacity", "LCD screen"]` | PDP highlight bullet points |
| `specifications` | `ProductSpec[]` (`{ name: string, value: string }[]`) | **Required** | `[{ name: "Chamber Volume", value: "18 Litres" }]` | PDP Specifications table |
| `images` | `string[]` | **Required** | `["/images/autoclave-1.jpg", "..."]` | Thumbnail gallery, Product cards, Search preview, Cart drawer |
| `inStock` | `boolean` | **Required** | `true` | "In Stock" badge, Add-to-cart disable state, filter |
| `stockCount` | `number` | Optional | `14` | Stock quantity countdown / inventory warning |
| `leadTime` | `string` | **Required** | `"Next-day UK clinical courier"` | Delivery timing indicator on PDP and Quick View |
| `brand` | `string` | **Required** | `"EvyMed Pro"` | Brand facet filter, PDP metadata line |
| `isFeatured` | `boolean` | Optional | `true` | Homepage Featured Products section |
| `isPromoEssential`| `boolean` | Optional | `true` | Category landing banners / promo carousel |

### UI Priority Breakdown
* **Required for Core UI**: `id`, `sku`, `name`, `slug`, `category`, `categoryName`, `price`, `shortDescription`, `description`, `features`, `specifications`, `images`, `inStock`, `leadTime`, `brand`.
* **Optional / Progressive Enhancement**: `subcategory`, `subcategoryName`, `productType`, `compareAtPrice`, `rating`, `reviewCount`, `badge`, `stockCount`, `isFeatured`, `isPromoEssential`.

---

## 2. Category Contract

### Current Representation
The frontend currently uses a **hybrid 2-tier nested structure**:
1. **Top-Level Department (`MainCategory`)**:
   * 4 hardcoded main categories: `medical-equipment`, `laboratory`, `medical-consumables`, `medical-apparel`.
   * Each department contains: `id`, `name`, `description`, `imageUrl`, and an array of `subcategories`.
2. **Sub-Categories (`SubCategoryItem`)**:
   * Each contains: `id` (slug format, e.g. `sterilisation`, `diagnostic-devices`, `reagents`) and `name` (display title).
3. **Category Summary Objects (`Category`)**:
   * Used for homepage category cards and the header mega-menu:
     * `id`: `string`
     * `name`: `string`
     * `shortName`: `string`
     * `description`: `string`
     * `itemCount`: `number` (aggregated product count)
     * `imageUrl`: `string`
     * `featured`: `boolean`
     * `subcategories`: `SubCategoryItem[]`

### Relationship Model
* Products reference their parent category via `product.category` (matching `MainCategory`) and optionally `product.subcategory` (matching `subcategories[i].id`).
* **Backend Expectation**: The backend can store categories hierarchically (parent-child), providing a nested tree for the navigation/mega-menu and flat category tags for product filtering.

---

## 3. Search Contract

### Current Implementation vs Future API Expectation
* **Current Mode**: Client-side filtering across in-memory `PRODUCTS` and `CATEGORIES` arrays.
* **Future Expectation**: Search will transition to a backend query endpoint while preserving two distinct frontend surfaces:
  1. **Instant Suggestion Dropdown (`SearchBar`)**:
     * **Request**: `GET /api/v1/search/suggest?q={query}&limit=6`
     * **Response**:
       * `products`: Array of max 6 items with lightweight fields (`id`, `name`, `sku`, `price`, `images[0]`, `categoryName`, `shortDescription`).
       * `categories`: Array of matched department/subcategory items (`id`, `name`, `type`).
  2. **Full Catalogue Search (`ShopPage`)**:
     * **Request**: `GET /api/v1/products?q={query}&category={category}&subcategory={subcategory}&brand={brand}&minPrice={min}&maxPrice={max}&inStock={boolean}&sortBy={sort}&page={page}&limit={limit}`
     * **Response Structure**:
       ```json
       {
         "items": [ /* Full Product Objects */ ],
         "pagination": {
           "total": 48,
           "page": 1,
           "limit": 12,
           "totalPages": 4
         },
         "facets": {
           "availableBrands": ["EvyMed Pro", "BioLab Precision"],
           "availableProductTypes": ["Autoclaves", "Centrifuges"],
           "priceRange": { "min": 12.50, "max": 2450.00 }
         }
       }
       ```

---

## 4. Cart Contract

### Current Client-Side Structure
* **Cart Item Model**:
  ```typescript
  interface CartItem {
    product: Product;
    quantity: number;
    selectedColor?: string; // reserved
    selectedSize?: string;  // reserved
  }
  ```
* **Client-Side Calculations (Currently performed in `CartContext`)**:
  * `totalItems` = Sum of all item quantities
  * `subtotal` = Sum of `(product.price * quantity)` (ex. VAT)
  * `estimatedShipping` = Subtotal >= £50.00 ? £0.00 : £4.95
  * `vat` = Subtotal * 0.20 (20% standard UK VAT rate)
  * `total` = `subtotal + estimatedShipping + vat`

### Server Validation Requirements
* **Browser data cannot be trusted for financial operations.**
* The backend must validate:
  1. **Authoritative Prices**: Read prices from the database, ignoring client-submitted prices.
  2. **Inventory & Stock Limits**: Confirm that requested quantities are currently in stock.
  3. **VAT Determination**: Compute exact UK VAT based on product category rules (e.g. zero-rated medical exemptions vs standard 20%).
  4. **Shipping Rules**: Compute accurate delivery rates based on delivery postcode, total weight, and temperature requirements.

---

## 5. Quick Order Contract

### Data Flow
1. **Single SKU Input**: User types SKU (e.g., `EVS-AUT-018` or partial text).
2. **Lookup Trigger**: Triggers exact or autocomplete lookup.
3. **Lookup Response**: Returns the matched product object (`id`, `sku`, `name`, `price`, `images[0]`, `inStock`, `leadTime`).
4. **Quantity Selection**: User sets desired units (with bounds check against stock).
5. **Batch Multi-SKU Input**: User enters multiple rows `[ { sku: "EVS-001", qty: 2 }, { sku: "EVS-002", qty: 10 } ]`.

### Required Backend Endpoint
* **Proposed Route**: `POST /api/v1/products/quick-lookup`
* **Request Payload**:
  ```json
  {
    "items": [
      { "sku": "EVS-AUT-018", "quantity": 1 },
      { "sku": "EVS-GLV-100", "quantity": 5 }
    ]
  }
  ```
* **Response Payload**:
  ```json
  {
    "resolved": [
      { "sku": "EVS-AUT-018", "product": { /* Product */ }, "requestedQty": 1, "available": true },
      { "sku": "EVS-GLV-100", "product": { /* Product */ }, "requestedQty": 5, "available": true }
    ],
    "unresolvedSkus": []
  }
  ```

---

## 6. User & Account Contract

### Current State
* Currently a demonstration modal (`AccountModal.tsx`) with two distinct flows:
  1. **Practitioner Login**: Standard email + password fields.
  2. **NHS / Institutional Portal**: NHS Trust name + Purchase Order (PO) number lookup.

### Required Data Schema for Backend
* **User Profile**:
  * `id`: `string`
  * `email`: `string`
  * `fullName`: `string`
  * `organization`: `string` (Clinic / Hospital / NHS Trust)
  * `accountType`: `'standard'` | `'nhs_institution'` | `'trade_credit'`
  * `creditLimit`: `number` (optional, for 30-day invoice billing)
  * `savedAddresses`: Array of delivery/billing addresses.

---

## 7. Checkout Contract

### Data Collected by Frontend (`CheckoutMockModal.tsx`)
* **Recipient & Organization Details**:
  * `clinicName`: `string` (optional / B2B)
  * `contactName`: `string` (required)
  * `email`: `string` (required)
  * `phone`: `string` (required)
* **Delivery Address**:
  * `addressLine1`: `string` (required)
  * `city`: `string` (required)
  * `postcode`: `string` (required UK postcode)
* **Billing & Settlement Preference**:
  * `paymentMethod`: `'invoice'` (30-day clinical invoice) | `'nhs-po'` (NHS Purchase Order) | `'card'` (Credit/Debit Card via future gateway)
  * `poNumber`: `string` (required if paymentMethod is `nhs-po`)

### Server-Validated Security Boundaries
| Field / Step | Frontend Responsibility | Server-Side Responsibility |
| :--- | :--- | :--- |
| **Address & Postcode** | Format & UK regex validation | Delivery zone verification & address normalization |
| **Line Items & Quantities** | Display active cart | Lock inventory & verify product availability |
| **Item Unit Prices** | Display cached price | Fetch authoritative unit prices from database |
| **VAT & Surcharges** | Estimate 20% VAT | Apply authoritative tax rates & duty exemptions |
| **Credit Terms / PO** | Capture PO string | Verify NHS Trust credit limit / approval status |

---

## 8. Order Contract

### Minimum Order Entity Schema
```typescript
interface Order {
  id: string;                    // e.g. "EVS-ORD-839201"
  orderNumber: string;           // Formatted customer reference
  createdAt: string;             // ISO-8601 timestamp
  status: 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  paymentStatus: 'pending_invoice' | 'po_verified' | 'paid' | 'failed';
  paymentMethod: 'invoice' | 'nhs_po' | 'card' | 'bacs';
  poNumber?: string;
  customer: {
    userId?: string;
    clinicName?: string;
    contactName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    addressLine1: string;
    city: string;
    postcode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    unitPriceExVat: number;
    quantity: number;
    lineTotalExVat: number;
    vatRate: number;
  }>;
  financials: {
    subtotalExVat: number;
    shippingFeeExVat: number;
    totalVat: number;
    grandTotalIncVat: number;
    currency: 'GBP';
  };
  fulfillment: {
    trackingNumber?: string;
    courier?: string;
    estimatedDispatchDate?: string;
  };
}
```

---

## 9. Admin Requirements

Based on the frontend catalog and customer journeys, the future administration API must support:

1. **Product Management**:
   * Create, update, archive products.
   * Update SKU, base price, compare price, and VAT category.
   * Manage inventory counts (`stockCount`) and toggle `inStock` availability.
   * Edit technical specifications table and highlight features.
2. **Category & Taxonomy Management**:
   * Manage 4 primary departments and their subcategory slugs/titles.
3. **Order Processing**:
   * View paginated order list with status filters (`pending`, `processing`, `dispatched`).
   * Verify and approve NHS Purchase Orders / 30-Day invoices.
   * Update order status and append courier tracking numbers.
4. **Customer Accounts & Credit**:
   * View registered healthcare practices and approve institutional credit terms.

---

## 10. Mock Data Dependencies

| File / Component | Mock Dependency | Future Data Source / API Endpoint |
| :--- | :--- | :--- |
| `src/pages/HomePage.tsx` | `PRODUCTS`, `CATEGORIES` | `GET /api/v1/products/featured`, `GET /api/v1/categories` |
| `src/pages/ShopPage.tsx` | `PRODUCTS`, `CATEGORIES`, `MEGA_MENU_CATEGORIES` | `GET /api/v1/products?[filters]`, `GET /api/v1/categories` |
| `src/pages/ProductDetailPage.tsx` | `PRODUCTS` (lookup & related items) | `GET /api/v1/products/:slug`, `GET /api/v1/products/:id/related` |
| `src/components/SearchBar.tsx` | `PRODUCTS`, `CATEGORIES` | `GET /api/v1/search/suggest?q=...` |
| `src/components/QuickOrderModal.tsx` | `PRODUCTS` | `POST /api/v1/products/quick-lookup` |
| `src/components/Header.tsx` & `MegaMenu.tsx` | `MEGA_MENU_CATEGORIES` | `GET /api/v1/categories/tree` |
| `src/components/Footer.tsx` | `CATEGORIES` | `GET /api/v1/categories` |
| `src/context/CartContext.tsx` | `localStorage` (`mazi_medics_cart_v1`) | Client localStorage sync with `POST /api/v1/cart/validate` |
| `src/pages/CheckoutMockModal.tsx` | In-memory random generator (`MM-ORD-...`) | `POST /api/v1/orders` |

---

## 11. Proposed API Surface

*(All endpoints marked as **PROPOSED** — to be refined during backend architecture planning)*

```text
# Catalog & Taxonomy
GET    /api/v1/categories                    # List all categories and item counts
GET    /api/v1/categories/tree               # Department & subcategory hierarchy for Mega Menu
GET    /api/v1/products                      # Paginated, filtered, and sorted catalogue
GET    /api/v1/products/:slug                # Complete Product Detail record
GET    /api/v1/products/:id/related          # 4 related/complementary products

# Search & Quick Order
GET    /api/v1/search/suggest?q={query}      # Fast autocomplete for search bar dropdown
POST   /api/v1/products/quick-lookup         # Batch SKU lookup for Quick Order modal

# Cart & Validation
POST   /api/v1/cart/validate                 # Validate items, stock, and calculate authoritative totals

# Orders & Checkout
POST   /api/v1/orders                        # Submit and create an order
GET    /api/v1/orders/:id                    # Retrieve order status & summary by reference

# Authentication & Account
POST   /api/v1/auth/login                    # Practitioner login
POST   /api/v1/auth/nhs-lookup               # NHS Purchase Order / Trust validation
GET    /api/v1/account/orders                # Order history for authenticated practitioner
```

---

## 12. Open Decisions

1. **Authentication Strategy**: Standard session cookies vs JWT bearer tokens (especially regarding institutional B2B accounts with multiple purchasers).
2. **Database Schema & Technology**: Relational SQL (PostgreSQL recommended for strict B2B order consistency and financial ledger integrity) vs Document store.
3. **VAT Handling Rules**: Whether all products carry a flat 20% UK VAT rate or if specific medical products support zero-rated VAT relief certificates at checkout.
4. **Order Reference Format**: Confirmation on order ID format conventions (e.g. `EVS-ORD-YYYY-XXXXX`).
5. **Cart Persistence**: Whether anonymous guest carts remain in browser `localStorage` until checkout or persist to server-side Redis sessions.
