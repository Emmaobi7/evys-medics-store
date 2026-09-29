import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';
import { formatNaira } from '../utils/money';

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
    totalItems,
  } = useCart();

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

        {/* Delivery Note */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-accent-subtle)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--color-primary)',
          }}
        >
          <Truck size={14} />
          <span>Admin-coordinated &amp; standard dispatch in Nigeria</span>
        </div>

        {/* Drawer Body */}
        {cart.length === 0 ? (
          <div className="cart-drawer-empty">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: 'var(--color-muted)',
              }}
            >
              <ShoppingBag size={28} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px' }}>Your basket is empty</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '20px' }}>
              Add medical, lab, or clinical supplies to view them here.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsCartOpen(false);
                onNavigateToShop();
              }}
            >
              Explore Products
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
                    {formatNaira(item.product.price * item.quantity)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '6px' }}>
                      ({formatNaira(item.product.price)} each)
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
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Delivery</span>
              <span>{estimatedShipping === 0 ? 'Admin / Standard (₦0.00)' : formatNaira(estimatedShipping)}</span>
            </div>
            <div className="cart-summary-row total">
              <span>Total Payable</span>
              <span>{formatNaira(total)}</span>
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
                View Full Basket
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
