import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { SkeletonProductCard } from './SkeletonLoader';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  emptyMessage?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onSelectProduct,
  onQuickView,
  emptyMessage = 'No medical supplies found matching your criteria.',
}) => {
  if (isLoading) {
    return (
      <div className="product-grid" aria-busy="true" aria-label="Loading supplies">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        style={{
          padding: '64px 24px',
          textAlign: 'center',
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '8px' }}>
          No Products Found
        </div>
        <p style={{ maxWidth: '400px', margin: '0 auto' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelectProduct}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
};
