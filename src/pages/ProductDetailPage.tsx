import React from 'react';
import { ChevronRight, Truck, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { ProductGallery } from '../components/ProductGallery';
import { ProductInfo } from '../components/ProductInfo';
import { ProductGrid } from '../components/ProductGrid';

interface ProductDetailPageProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigateShop: () => void;
  onNavigateHome: () => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onSelectProduct,
  onQuickView,
  onNavigateShop,
  onNavigateHome,
  onBuyNow,
}) => {
  // Related products from same category or same subcategory, excluding current product
  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  // If fewer than 4 in same category, pad with other products
  const finalRelated = relatedProducts.length >= 4
    ? relatedProducts
    : [
        ...relatedProducts,
        ...PRODUCTS.filter((p) => p.id !== product.id && !relatedProducts.some((r) => r.id === p.id)).slice(0, 4 - relatedProducts.length)
      ];

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ padding: '20px 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
          Home
        </a>
        <ChevronRight size={14} />
        <a href="#shop" onClick={(e) => { e.preventDefault(); onNavigateShop(); }}>
          Shop
        </a>
        <ChevronRight size={14} />
        <span>{product.categoryName}</span>
        {product.subcategoryName && (
          <>
            <ChevronRight size={14} />
            <span>{product.subcategoryName}</span>
          </>
        )}
        <ChevronRight size={14} />
        <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main PDP Grid (Gallery Left + Info Right) */}
      <div className="pdp-grid">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductInfo product={product} onBuyNow={onBuyNow} />
      </div>

      {/* Structured Supplier Information Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '64px' }}>
        {/* Section 1: Product Information & Specifications */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '16px' }}>
            Product Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxWidth: '800px' }}>
            {product.description.map((paragraph, idx) => (
              <p key={idx} style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--color-ink)' }}>
                {paragraph}
              </p>
            ))}
          </div>

          <div style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Specifications Table
            </h3>
            <table className="specs-table">
              <tbody>
                {product.specifications.map((spec, index) => (
                  <tr key={index}>
                    <td style={{ width: '35%', fontWeight: 600 }}>{spec.name}</td>
                    <td>{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Delivery Information */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Truck size={22} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)' }}>
              Delivery Information
            </h2>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink)', lineHeight: 1.6, marginBottom: '8px' }}>
            UK delivery available.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            Delivery options and estimated times are shown during checkout.
          </p>
        </div>
      </div>

      {/* Section 3: Related Products (4 items) */}
      <section>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div className="section-eyebrow">Supplier Catalogue</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Related Products</h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onNavigateShop}
          >
            View all {product.categoryName}
          </button>
        </div>

        <ProductGrid
          products={finalRelated}
          onSelectProduct={onSelectProduct}
          onQuickView={onQuickView}
        />
      </section>
    </div>
  );
};
