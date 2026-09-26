import React, { useState } from 'react';
import { Trash2, ShoppingBag, ArrowRight, Truck, ChevronRight, Tag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { QuantitySelector } from '../components/QuantitySelector';
import { Button } from '../components/Button';
import { Product } from '../types';

interface CartPageProps {
  onNavigateToCheckout: () => void;
  onNavigateToShop: () => void;
  onNavigateHome: () => void;
  onSelectProduct: (product: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateToCheckout,
  onNavigateToShop,
  onNavigateHome,
  onSelectProduct,
}) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    estimatedShipping,
    freeShippingThreshold,
    shippingRemaining,
    totalItems,
  } = useCart();

  const { showToast } = useToast();
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'EVY10' || code === 'EVYS10' || code === 'CLINIC10') {
      const discount = subtotal * 0.1;
      setAppliedDiscount(discount);
      showToast('Promo Code Applied', '10% discount applied to your order.');
    } else {
      showToast('Invalid Code', 'Try code EVY10 or CLINIC10 for 10% discount.', 'warning');
    }
  };

  const discountedSubtotal = Math.max(0, subtotal - appliedDiscount);
  const vatAmount = discountedSubtotal * 0.2;
  const grandTotal = discountedSubtotal + estimatedShipping + vatAmount;

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 20px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
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
              margin: '0 auto 16px auto',
              color: 'var(--color-muted)',
            }}
          >
            <ShoppingBag size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Your basket is empty.</h1>
          <p style={{ marginBottom: '24px', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            Browse our medical and laboratory supplies to get started.
          </p>
          <Button variant="primary" size="lg" icon={<ArrowRight size={18} />} onClick={onNavigateToShop}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '64px' }}>
      {/* Breadcrumbs */}
      <nav style={{ padding: '16px 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
          Home
        </a>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Shopping Basket ({totalItems} items)</span>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Medical Order Basket</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}>
            Review your items and proceed to checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-muted)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          <Trash2 size={15} />
          <span>Clear Basket</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Cart Item Cards List */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.map((item) => {
              const lineTotalEx = item.product.price * item.quantity;
              const lineTotalInc = lineTotalEx * 1.2;
              const unitInc = item.product.price * 1.2;

              return (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--color-border)',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FAFAFA',
                        border: '1px solid var(--color-border)',
                        padding: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      onClick={() => onSelectProduct(item.product)}
                    />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                        {item.product.categoryName}
                      </span>
                      <h3
                        style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', cursor: 'pointer', lineHeight: 1.3 }}
                        onClick={() => onSelectProduct(item.product)}
                      >
                        {item.product.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                        SKU: <strong style={{ fontFamily: 'var(--font-mono)' }}>{item.product.sku}</strong> • £{item.product.price.toFixed(2)} ex. VAT (£{unitInc.toFixed(2)} inc. VAT)
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Line Total in responsive bottom row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                    <QuantitySelector
                      quantity={item.quantity}
                      onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
                      onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
                      max={item.product.stockCount}
                      size="sm"
                    />

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-ink)' }}>
                        £{lineTotalEx.toFixed(2)} <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--color-muted)' }}>ex. VAT</span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)' }}>
                        £{lineTotalInc.toFixed(2)} inc. VAT
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                      }}
                      title="Remove item"
                      aria-label="Remove item from basket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={onNavigateToShop}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={14} />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>

        {/* Order Summary Box */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>Order Summary</h2>

          {/* Free delivery progress */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-accent-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
              <Truck size={14} />
              {shippingRemaining > 0 ? (
                <span>Add £{shippingRemaining.toFixed(2)} more for Free Delivery</span>
              ) : (
                <span style={{ color: 'var(--color-success)' }}>Free Delivery Applied!</span>
              )}
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(8, 126, 139, 0.15)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                  height: '100%',
                  backgroundColor: shippingRemaining === 0 ? 'var(--color-success)' : 'var(--color-primary)',
                }}
              />
            </div>
          </div>

          {/* Promo Code Form */}
          <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Tag size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                placeholder="Code (e.g. EVY10)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <Button variant="secondary" size="sm" type="submit">
              Apply
            </Button>
          </form>

          {/* Summary Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              <span>Subtotal (ex. VAT)</span>
              <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>£{subtotal.toFixed(2)}</span>
            </div>

            {appliedDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-success)' }}>
                <span>Discount</span>
                <span style={{ fontWeight: 600 }}>-£{appliedDiscount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              <span>Delivery</span>
              <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                {estimatedShipping === 0 ? 'FREE' : `£${estimatedShipping.toFixed(2)}`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              <span>VAT (20%)</span>
              <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>£{vatAmount.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '2px dashed var(--color-border)',
                fontSize: '1.125rem',
                fontWeight: 800,
                color: 'var(--color-ink)',
              }}
            >
              <span>Total Payable</span>
              <span>£{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ArrowRight size={18} />}
            onClick={onNavigateToCheckout}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};
