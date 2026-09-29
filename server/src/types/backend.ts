export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: DbCategory[];
  item_count?: number;
}

export interface DbProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string;
  subcategory_id: string | null;
  brand: string;
  short_description: string | null;
  description: string | null;
  product_type: string | null;
  price_ex_vat: string | number;
  compare_at_price_ex_vat: string | number | null;
  vat_rate: string | number;
  lead_time: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  subcategory_name?: string;
  stock_count?: number;
  in_stock?: boolean;
  images?: string[];
  features?: string[];
  specifications?: Array<{ name: string; value: string }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CartValidationItemInput {
  productId?: string;
  sku?: string;
  quantity: number;
}

export interface CartValidationResultItem {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  unitPriceExVat: number;
  requestedQuantity: number;
  validatedQuantity: number;
  availableStock: number;
  isAvailable: boolean;
  vatRate: number;
  lineTotal: number;
  lineTotalExVat: number;
  lineVatTotal: number;
  lineTotalIncVat: number;
  imageUrl?: string;
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  clinicName?: string;
  poNumber?: string;
  paymentMethod: 'paystack' | 'card' | 'bank_transfer' | 'invoice' | 'nhs_po';
  shippingAddressLine1: string;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface DbPayment {
  id: string;
  order_id: string;
  provider: 'paystack';
  provider_reference: string;
  amount: string | number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_data: any;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
}
