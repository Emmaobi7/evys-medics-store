export type MainCategory =
  | 'medical-equipment'
  | 'laboratory'
  | 'medical-consumables'
  | 'medical-apparel';

export interface SubCategoryItem {
  id: string;
  name: string;
}

export interface MegaMenuCategory {
  id: MainCategory;
  name: string;
  subcategories: SubCategoryItem[];
  description: string;
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
  shortName: string;
  description: string;
  itemCount: number;
  imageUrl: string;
  featured?: boolean;
  subcategories?: SubCategoryItem[];
}

export interface ProductSpec {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: MainCategory;
  categoryName: string;
  subcategory?: string;
  subcategoryName?: string;
  productType?: string;
  price: number; // in NGN ₦ (tax-inclusive final price)
  compareAtPrice?: number;
  rating: number; // 0 - 5
  reviewCount: number;
  badge?: 'Bestseller' | 'Popular' | 'New' | 'ISO Certified' | 'Standard';
  shortDescription: string;
  description: string[];
  features: string[];
  specifications: ProductSpec[];
  images: string[];
  inStock: boolean;
  stockCount: number;
  leadTime: string; // e.g. "Reliable delivery available"
  brand: string;
  isFeatured?: boolean;
  isPromoEssential?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface FilterState {
  category: string;
  subcategory: string;
  productType: string;
  brand: string;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';
  badgeFilter?: string;
}
