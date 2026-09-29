import React, { useState } from 'react';
import { Star, ShoppingBag, Eye, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { Badge } from './Badge';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/money';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickView,
}) => {
  const { addToCart, cart } = useCart();
  const { showToast } = useToast();
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isAlreadyInCart = cart.some((item) => item.product.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock || isAdding) return;

    setIsAdding(true);
    addToCart(product, 1);
    setIsJustAdded(true);
    showToast(`Added to Basket`, `${product.name} (${product.sku}) added to your basket.`);

    setTimeout(() => {
      setIsJustAdded(false);
      setIsAdding(false);
    }, 1600);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <div
      className={`product-card ${!product.inStock ? 'product-card-out-of-stock' : ''}`}
      onClick={() => onSelect(product)}
      role="article"
      aria-label={`${product.name}, ${formatNaira(product.price)}`}
    >
      <div className="product-card-image-wrap">
        {product.badge && (
          <div className="product-card-badge">
            <Badge type={product.badge} />
          </div>
        )}

        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80';
          }}
        />

        <div className="product-card-quick-actions">
          {onQuickView && (
            <button
              type="button"
              className="quick-action-btn"
              onClick={handleQuickView}
              title="Quick view product details"
              aria-label={`Quick view ${product.name}`}
            >
              <Eye size={16} />
            </button>
          )}
          {product.inStock && (
            <button
              type="button"
              className="quick-action-btn"
              onClick={handleAddToCart}
              disabled={isAdding}
              title="Add 1 to Basket"
              aria-label={`Add 1 ${product.name} to basket`}
              style={{
                backgroundColor: isJustAdded ? 'var(--color-primary)' : 'var(--color-white)',
                color: isJustAdded ? 'var(--color-white)' : 'var(--color-ink)',
              }}
            >
              {isJustAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className="product-card-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="product-card-category">{product.categoryName}</span>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontWeight: 600 }}>
            {product.sku}
          </span>
        </div>

        <h3
          className="product-card-name"
          onClick={() => onSelect(product)}
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="product-card-rating">
          {product.rating ? (
            <>
              <div className="star-rating">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < Math.floor(product.rating) ? '#F79009' : 'none'}
                    stroke="#F79009"
                  />
                ))}
              </div>
              <span>({product.reviewCount})</span>
              <span style={{ color: 'var(--color-border-dark)' }}>•</span>
            </>
          ) : null}
          <span style={{ color: product.inStock ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
            {product.inStock ? 'In stock' : 'Out of stock'}
          </span>
        </div>

        <div className="product-card-footer">
          <div className="product-price-wrap">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="product-price">{formatNaira(product.price)}</span>
              {product.compareAtPrice && (
                <span className="product-compare-price">{formatNaira(product.compareAtPrice)}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`btn btn-sm ${!product.inStock ? 'btn-secondary' : isJustAdded ? 'btn-primary' : 'btn-outline-teal'}`}
            onClick={handleAddToCart}
            disabled={!product.inStock || isAdding}
            style={{
              borderRadius: 'var(--radius-sm)',
              gap: '6px',
              transition: 'all 200ms ease',
              minWidth: '78px',
              opacity: !product.inStock ? 0.65 : 1,
              cursor: !product.inStock ? 'not-allowed' : 'pointer',
            }}
          >
            {!product.inStock ? (
              <span>Unavailable</span>
            ) : isJustAdded ? (
              <>
                <Check size={14} />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
