import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';

interface CartDrawerProps {
  onNavigateToCartPage: () => void;
  onNavigateToCheckout: () => void;
  onNavigateToShop: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onNavigateToCartPage,
  onNavigateToCheckout,
  onNavigateToShop,
}) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    estimatedShipping,
    total,
    freeShippingThreshold,
    shippingRemaining,
    totalItems,
  } = useCart();

  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <>
      <div
        className={`drawer-backdrop ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <aside className={`cart-drawer ${isCartOpen ? 'open' : ''}`} aria-label="Shopping Cart Drawer">
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <ShoppingBag size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Basket ({totalItems})</span>
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close basket"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--color-accent-subtle)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              marginBottom: '6px',
            }}
          >
            <Truck size={15} />
            {shippingRemaining > 0 ? (
              <span>
                Add <strong>£{shippingRemaining.toFixed(2)}</strong> more for FREE UK Delivery
              </span>
            ) : (
              <span style={{ color: 'var(--color-success)' }}>
                You have qualified for <strong>FREE UK Delivery</strong>!
              </span>
            )}
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(8, 126, 139, 0.15)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: shippingRemaining === 0 ? 'var(--color-success)' : 'var(--color-primary)',
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </div>

        {/* Item List */}
        {cart.length === 0 ? (
          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: 'var(--color-muted)',
              }}
            >
              <ShoppingBag size={28} />
            </div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Your basket is empty</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '24px', maxWidth: '260px' }}>
              Explore our clinical and laboratory catalogues to start ordering supplies.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsCartOpen(false);
                onNavigateToShop();
              }}
            >
              Shop All Products
            </Button>
          </div>
        ) : (
          <div className="cart-drawer-items">
            {cart.map((item) => (
              <div key={item.product.id} className="cart-item-card">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <div>
                    <h4 className="cart-item-title">{item.product.name}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                      SKU: {item.product.sku}
                    </div>
                  </div>

                  <div className="cart-item-price">
                    £{(item.product.price * item.quantity).toFixed(2)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '6px' }}>
                      (£{item.product.price.toFixed(2)} each)
                    </span>
                  </div>

                  <div className="cart-item-actions">
                    <QuantitySelector
                      quantity={item.quantity}
                      onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
                      onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
                      size="sm"
                    />

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with totals and action buttons */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-row">
              <span>Subtotal (ex. VAT)</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Est. VAT (20%)</span>
              <span>£{(subtotal * 0.2).toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>UK Mainland Shipping</span>
              <span>{estimatedShipping === 0 ? 'FREE' : `£${estimatedShipping.toFixed(2)}`}</span>
            </div>
            <div className="cart-summary-row total">
              <span>Estimated Total (inc. VAT)</span>
              <span>£{(total + subtotal * 0.2).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<ArrowRight size={18} />}
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigateToCheckout();
                }}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigateToCartPage();
                }}
              >
                View Full Basket &amp; VAT Breakdown
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
