import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onViewFullPage: (product: Product) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onViewFullPage,
  onBuyNow,
}) => {
  if (!product) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 23, 38, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '960px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          padding: '36px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px', zIndex: 10 }}>
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              onClose();
              onViewFullPage(product);
            }}
            title="View full product page"
          >
            <ExternalLink size={18} />
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={onClose}
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="quickview-grid">
          <ProductGallery images={product.images} productName={product.name} />
          <ProductInfo product={product} onBuyNow={onBuyNow} />
        </div>
      </div>
    </div>
  );
};
