import { Product, Category, MegaMenuCategory, FilterState } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

export class ApiClientError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;

      try {
        const errorData = await response.json();
        if (errorData?.error) errorMessage = errorData.error;
        if (errorData?.details) errorDetails = errorData.details;
      } catch {
        // Fall back to HTTP statusText
      }

      throw new ApiClientError(errorMessage, response.status, errorDetails);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError(
      err.message || "Unable to connect to Evy's Projects server. Please check your network connection.",
      0
    );
  }
}

// ----------------------------------------------------
// Category API Services
// ----------------------------------------------------

export async function fetchCategories(): Promise<Category[]> {
  const data = await apiFetch<{ categories: Category[] }>('/categories');
  return data.categories;
}

export async function fetchCategoryTree(): Promise<MegaMenuCategory[]> {
  const data = await apiFetch<{ categories: MegaMenuCategory[] }>('/categories/tree');
  return data.categories;
}

// ----------------------------------------------------
// Product API Services
// ----------------------------------------------------

export interface ProductsResponse {
  items: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets: {
    availableBrands: string[];
    availableProductTypes: string[];
    priceRange: { min: number; max: number };
  };
}

export async function fetchProducts(filters?: Partial<FilterState> & { page?: number; limit?: number }): Promise<ProductsResponse> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.searchQuery?.trim()) params.set('q', filters.searchQuery.trim());
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.subcategory && filters.subcategory !== 'all') params.set('subcategory', filters.subcategory);
    if (filters.brand && filters.brand !== 'all') params.set('brand', filters.brand);
    if (filters.productType && filters.productType !== 'all') params.set('product_type', filters.productType);
    if (filters.minPrice !== undefined && filters.minPrice > 0) params.set('min_price', String(filters.minPrice));
    if (filters.maxPrice !== undefined && filters.maxPrice > 0 && filters.maxPrice < 10000000) params.set('max_price', String(filters.maxPrice));
    if (filters.inStockOnly) params.set('in_stock', 'true');
    if (filters.sortBy) params.set('sort', filters.sortBy);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<ProductsResponse>(`/products${queryString}`);
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const data = await apiFetch<{ product: Product }>(`/products/${encodeURIComponent(slug)}`);
  return data.product;
}

export async function fetchRelatedProducts(productId: string): Promise<Product[]> {
  const data = await apiFetch<{ related: Product[] }>(`/products/${encodeURIComponent(productId)}/related`);
  return data.related;
}

// ----------------------------------------------------
// Search & Quick Order API Services
// ----------------------------------------------------

export interface SearchSuggestionsResult {
  products: Array<{
    id: string;
    sku: string;
    name: string;
    slug: string;
    price: number;
    categoryName: string;
    shortDescription: string;
    imageUrl?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    isSubcategory: boolean;
  }>;
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestionsResult> {
  if (!query.trim()) return { products: [], categories: [] };
  return apiFetch<SearchSuggestionsResult>(`/search/suggest?q=${encodeURIComponent(query.trim())}`);
}

export interface QuickLookupResponse {
  resolved: Array<{
    sku: string;
    product: Product;
    requestedQty: number;
    availableStock: number;
    isAvailable: boolean;
  }>;
  unresolvedSkus: string[];
}

export async function lookupQuickOrder(items: Array<{ sku: string; quantity: number }>): Promise<QuickLookupResponse> {
  return apiFetch<QuickLookupResponse>('/products/quick-lookup', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ----------------------------------------------------
// Cart & Order Validation Services
// ----------------------------------------------------

export interface CartValidationResponse {
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    imageUrl?: string;
    unitPrice: number;
    unitPriceExVat: number;
    requestedQuantity: number;
    validatedQuantity: number;
    availableStock: number;
    isAvailable: boolean;
    hasSufficientStock: boolean;
    vatRate: number;
    lineTotal: number;
    lineTotalExVat: number;
    lineVatTotal: number;
    lineTotalIncVat: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  subtotalExVat: number;
  shippingExVat: number;
  vatTotal: number;
  grandTotalIncVat: number;
  currency: string;
  freeShippingThreshold: number;
  shippingRemaining: number;
}

export async function validateCartWithApi(items: Array<{ productId?: string; sku?: string; quantity: number }>): Promise<CartValidationResponse> {
  return apiFetch<CartValidationResponse>('/cart/validate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export interface CreateOrderPayload {
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
  idempotencyKey?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface CreateOrderResponse {
  message: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    subtotal: number;
    deliveryFee: number;
    total: number;
    subtotalExVat: number;
    shippingExVat: number;
    vatTotal: number;
    grandTotalIncVat: number;
    currency: string;
    createdAt: string;
    itemCount?: number;
  };
}

export async function submitOrderToApi(orderPayload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
}

// ----------------------------------------------------
// Paystack Payment API Services
// ----------------------------------------------------

export interface PaystackInitApiResponse {
  message: string;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
}

export async function initializePaystackPayment(orderId: string, callbackUrl?: string): Promise<PaystackInitApiResponse> {
  return apiFetch<PaystackInitApiResponse>('/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({ orderId, callbackUrl }),
  });
}

export interface PaystackVerifyApiResponse {
  success: boolean;
  message: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  reference: string;
  orderNumber: string;
  amount: number;
  currency: string;
  verifiedAt?: string;
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyApiResponse> {
  return apiFetch<PaystackVerifyApiResponse>(`/payments/verify/${encodeURIComponent(reference)}`);
}

// ----------------------------------------------------
// Authentication API Services
// ----------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser(token: string): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function requestPasswordReset(email: string, origin?: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, origin: origin || window.location.origin }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

// ----------------------------------------------------
// Admin API Services
// ----------------------------------------------------

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  categoryName: string;
  brand: string;
  priceExVat: number;
  compareAtPriceExVat?: number | null;
  stockCount: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId?: string;
  brand: string;
  shortDescription?: string;
  description?: string;
  productType?: string;
  priceExVat: number;
  compareAtPriceExVat?: number;
  vatRate?: number;
  leadTime?: string;
  stockCount?: number;
  images?: string[];
  specifications?: Array<{ name: string; value: string }>;
  features?: string[];
  isFeatured?: boolean;
}

export async function fetchAdminProducts(token: string): Promise<{ products: AdminProduct[] }> {
  return apiFetch<{ products: AdminProduct[] }>('/admin/products', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminProduct(token: string, productData: CreateProductPayload): Promise<{ message: string; product: any }> {
  return apiFetch<{ message: string; product: any }>('/admin/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(productData),
  });
}

export async function updateAdminStock(token: string, productId: string, stockCount: number): Promise<{ message: string; stockCount: number }> {
  return apiFetch<{ message: string; stockCount: number }>(`/admin/products/${productId}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ stockCount }),
  });
}

export async function updateAdminPrice(token: string, productId: string, priceExVat: number, compareAtPriceExVat?: number | null): Promise<{ message: string; product: any }> {
  return apiFetch<{ message: string; product: any }>(`/admin/products/${productId}/price`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ priceExVat, compareAtPriceExVat }),
  });
}

export async function deleteAdminProduct(token: string, productId: string, permanent: boolean = false): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/products/${productId}${permanent ? '?permanent=true' : ''}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function purgeAllProducts(token: string): Promise<{ message: string; deletedCount: number }> {
  return apiFetch<{ message: string; deletedCount: number }>('/admin/products/purge-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  clinicName?: string;
  poNumber?: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  grandTotalIncVat: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAdminOrders(token: string, status?: string): Promise<{ orders: AdminOrder[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ orders: AdminOrder[] }>(`/admin/orders${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateAdminOrderDelivery(token: string, orderId: string, deliveryFee: number): Promise<{ message: string; order: any }> {
  return apiFetch<{ message: string; order: any }>(`/admin/orders/${orderId}/delivery`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ deliveryFee }),
  });
}

export async function updateAdminOrderStatus(token: string, orderId: string, status?: string, paymentStatus?: string): Promise<{ message: string; order: any }> {
  return apiFetch<{ message: string; order: any }>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, paymentStatus }),
  });
}


