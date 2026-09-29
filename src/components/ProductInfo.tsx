import React, { useState } from 'react';
import { ShoppingBag, Zap, Truck, Check, Star, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/money';

interface ProductInfoProps {
  product: Product;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product, onBuyNow }) => {
  const [quantity, setQuantity] = useState(1);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    if (!product.inStock || isSubmitting) return;

    setIsSubmitting(true);
    addToCart(product, quantity);
    setIsJustAdded(true);
    showToast(`Added to Basket`, `${quantity}x ${product.name} (${product.sku}) added to your basket.`);

    setTimeout(() => {
      setIsJustAdded(false);
      setIsSubmitting(false);
    }, 1800);
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;
    onBuyNow(product, quantity);
  };

  const lineTotal = product.price * quantity;

  return (
    <div className="pdp-details-wrap">
      {/* Category & SKU */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
        <span className="pdp-brand" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8125rem' }}>
          {product.categoryName} {product.subcategoryName ? `• ${product.subcategoryName}` : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-muted)', fontWeight: 600 }}>
          SKU: {product.sku}
        </span>
      </div>

      {/* Product Name */}
      <h1 className="pdp-title" style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '10px' }}>
        {product.name}
      </h1>

      {/* Rating & Stock row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', fontSize: '0.875rem', flexWrap: 'wrap' }}>
        {product.rating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div className="star-rating">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(product.rating) ? '#F79009' : 'none'}
                  stroke="#F79009"
                />
              ))}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{product.rating}</span>
            <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>({product.reviewCount} reviews)</span>
            <span style={{ color: 'var(--color-border-dark)' }}>•</span>
          </div>
        ) : null}
        <span style={{ color: product.inStock ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span>●</span>
          <span>{product.inStock ? `In stock (${product.stockCount} available)` : 'Currently unavailable'}</span>
        </span>
      </div>

      {/* Price Box */}
      <div className="pdp-price-box" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div>
          <span className="pdp-price" style={{ fontSize: '1.875rem' }}>{formatNaira(product.price)}</span>
        </div>
        {product.compareAtPrice && (
          <span
            style={{
              fontSize: '1rem',
              color: 'var(--color-muted-light)',
              textDecoration: 'line-through',
            }}
          >
            {formatNaira(product.compareAtPrice)}
          </span>
        )}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)' }}>
            Final Price (Tax-Inclusive)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            Per unit
          </div>
        </div>
      </div>

      {/* Short Product Description */}
      <p style={{ fontSize: '0.95rem', color: 'var(--color-ink)', lineHeight: 1.6, marginBottom: '24px' }}>
        {product.shortDescription}
      </p>

      {/* Out of stock warning banner if applicable */}
      {!product.inStock && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEF3F2',
            border: '1px solid #FECDCA',
            borderRadius: 'var(--radius-md)',
            color: '#B42318',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>This clinical supply item is temporarily out of stock. Lead time estimate is 5–7 business days.</span>
        </div>
      )}

      {/* Quantity & CTA Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
        <div className="pdp-actions-row">
          <div className="pdp-qty-group">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Quantity
            </span>
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
              onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
              onChange={(newQty) => setQuantity(newQty)}
              max={product.stockCount || 1}
              disabled={!product.inStock}
            />
          </div>

          <div style={{ flexGrow: 1 }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!product.inStock || isSubmitting}
              icon={isJustAdded ? <Check size={18} /> : <ShoppingBag size={18} />}
              onClick={handleAddToCart}
              style={{
                backgroundColor: isJustAdded ? 'var(--color-success)' : undefined,
                borderColor: isJustAdded ? 'var(--color-success)' : undefined,
              }}
            >
              {!product.inStock
                ? 'Product Unavailable'
                : isJustAdded
                ? `Added ${quantity} to Basket!`
                : `Add to Basket • ${formatNaira(lineTotal)}`}
            </Button>
          </div>
        </div>

        {product.inStock && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-muted)', padding: '0 4px' }}>
            <span>Total for {quantity} unit{quantity > 1 ? 's' : ''}:</span>
            <span><strong>{formatNaira(lineTotal)}</strong></span>
          </div>
        )}

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={!product.inStock}
          icon={<Zap size={18} style={{ color: 'var(--color-primary)' }} />}
          onClick={handleBuyNow}
        >
          Buy Now (Direct Checkout)
        </Button>
      </div>

      {/* Delivery Summary Line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: '0.8125rem',
          color: 'var(--color-muted)',
        }}
      >
        <Truck size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <span>Reliable delivery &amp; dispatch nationwide. Admin-coordinated shipping.</span>
      </div>
    </div>
  );
};

