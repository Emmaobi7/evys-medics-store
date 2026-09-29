import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldCheck, Lock, ArrowRight, CreditCard, PackageCheck, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { submitOrderToApi, initializePaystackPayment, verifyPaystackPayment } from '../api/client';
import { Button } from '../components/Button';
import { formatNaira } from '../utils/money';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted: () => void;
}

export const CheckoutMockModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCompleted,
}) => {
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart();
  const [step, setStep] = useState<'details' | 'paystack_processing' | 'confirmation'>('details');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [paystackReference, setPaystackReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>('');

  // Generate a unique idempotency key when opening the modal
  useEffect(() => {
    if (isOpen) {
      idempotencyKeyRef.current = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setErrorMessage(null);
      setStep('details');
    }
  }, [isOpen]);

  const [shippingDetails, setShippingDetails] = useState({
    contactName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    postcode: '',
  });

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (cart.length === 0) {
      setErrorMessage('Your basket is empty. Please add items before completing checkout.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const orderPayload = {
      customerName: shippingDetails.contactName.trim(),
      customerEmail: shippingDetails.email.trim(),
      customerPhone: shippingDetails.phone.trim(),
      paymentMethod: 'paystack' as const,
      shippingAddressLine1: shippingDetails.addressLine1.trim(),
      shippingCity: shippingDetails.city.trim(),
      shippingPostcode: shippingDetails.postcode.trim(),
      shippingCountry: 'Nigeria',
      idempotencyKey: idempotencyKeyRef.current,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      // 1. Create server-authoritative pending order
      const res = await submitOrderToApi(orderPayload);
      setOrderId(res.order.id);
      setOrderNumber(res.order.orderNumber);

      // 2. Initialize Paystack payment transaction
      const callbackUrl = `${window.location.origin}/checkout/callback`;
      const paystackRes = await initializePaystackPayment(res.order.id, callbackUrl);
      setPaystackReference(paystackRes.reference);
      setPaystackAuthUrl(paystackRes.authorizationUrl);
      setStep('paystack_processing');

      // Open Paystack payment window
      if (paystackRes.authorizationUrl) {
        window.open(paystackRes.authorizationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      console.error('[Checkout] Order error:', err);
      setErrorMessage(
        err.message || 'Unable to complete order. Please verify stock availability and delivery details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Re-initializes Paystack for the existing order without creating a duplicate order
   */
  const handleRetryPaystackPayment = async () => {
    if (!orderId || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const callbackUrl = `${window.location.origin}/checkout/callback`;
      const paystackRes = await initializePaystackPayment(orderId, callbackUrl);
      setPaystackReference(paystackRes.reference);
      setPaystackAuthUrl(paystackRes.authorizationUrl);

      if (paystackRes.authorizationUrl) {
        window.open(paystackRes.authorizationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      console.error('[Paystack Retry Error]:', err);
      setErrorMessage(err.message || 'Unable to re-initialize Paystack transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Verifies Paystack transaction with backend
   */
  const handleVerifyPayment = async () => {
    if (!paystackReference || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const verifyRes = await verifyPaystackPayment(paystackReference);
      if (verifyRes.success && verifyRes.status === 'paid') {
        setStep('confirmation');
        clearCart();
        onOrderCompleted();
      } else {
        setErrorMessage('Payment verification is pending or not confirmed yet. Please complete the transaction on Paystack.');
      }
    } catch (err: any) {
      console.error('[Paystack Verification Error]:', err);
      setErrorMessage(err.message || 'Unable to verify payment with provider. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 23, 38, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 160,
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
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          padding: '36px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="action-btn"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px' }}
        >
          <X size={20} />
        </button>

        {step === 'details' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
              <Lock size={15} /> 256-BIT ENCRYPTED CHECKOUT
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', color: 'var(--color-ink)' }}>
              Delivery Information
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '20px' }}>
              Prices are tax-inclusive. Enter delivery details to proceed to secure Paystack settlement.
            </p>

            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: 'var(--color-danger-bg, #FEF2F2)',
                  color: 'var(--color-danger, #DC2626)',
                  border: '1px solid #FECACA',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Notice:</strong> {errorMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Recipient Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={shippingDetails.contactName}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, contactName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                />
              </div>

              {/* Email & Phone */}
              <div className="form-row-2col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@example.com"
                    value={shippingDetails.email}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                    Telephone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 801 234 5678"
                    value={shippingDetails.phone}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street Address, Building, Suite / Floor"
                  value={shippingDetails.addressLine1}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, addressLine1: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '12px', boxSizing: 'border-box' }}
                />
                <div className="form-row-2col">
                  <input
                    type="text"
                    required
                    placeholder="City / State *"
                    value={shippingDetails.city}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Postal Code / Area *"
                    value={shippingDetails.postcode}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, postcode: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Paystack Payment Notice */}
              <div
                style={{
                  border: '1.5px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'var(--color-primary-light)',
                }}
              >
                <CreditCard size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                    Payment Method: Paystack (Cards, Bank Transfer, USSD)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    Secure instant settlement in NGN (₦) via Paystack encrypted gateway
                  </div>
                </div>
              </div>

              {/* Order Summary breakdown */}
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                  <span>Items Subtotal</span>
                  <span style={{ fontWeight: 600 }}>{formatNaira(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                  <span>Delivery Charge</span>
                  <span style={{ fontWeight: 600 }}>
                    {deliveryFee === 0 ? 'Confirmed at Dispatch' : formatNaira(deliveryFee)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, borderTop: '1px dashed var(--color-border)', paddingTop: '8px', marginTop: '8px' }}>
                  <span>Total (Tax-Inclusive)</span>
                  <span style={{ color: 'var(--color-primary)' }}>{formatNaira(total)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                type="submit"
                isLoading={isSubmitting}
                icon={<ArrowRight size={18} />}
              >
                Pay Now with Paystack ({formatNaira(total)})
              </Button>
            </form>
          </div>
        )}

        {step === 'paystack_processing' && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <CreditCard size={32} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-ink)' }}>
              Complete Payment on Paystack
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px auto' }}>
              Your secure Paystack transaction has been initialized for <strong>{formatNaira(total)}</strong>.
            </p>

            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: 'var(--color-danger-bg, #FEF2F2)',
                  color: 'var(--color-danger, #DC2626)',
                  border: '1px solid #FECACA',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{errorMessage}</div>
              </div>
            )}

            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                maxWidth: '440px',
                margin: '0 auto 28px auto',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Order Number:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{orderNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Paystack Reference:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>{paystackReference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Amount:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatNaira(total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px', margin: '0 auto' }}>
              {paystackAuthUrl && (
                <a
                  href={paystackAuthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-lg"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ExternalLink size={16} /> Open Paystack Window
                </a>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isVerifying}
                onClick={handleVerifyPayment}
                icon={<RefreshCw size={16} />}
              >
                I Have Completed Payment
              </Button>

              {errorMessage && (
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  isLoading={isSubmitting}
                  onClick={handleRetryPaystackPayment}
                  icon={<RefreshCw size={14} />}
                >
                  Retry Payment for this Order
                </Button>
              )}

              <button
                type="button"
                onClick={() => setStep('details')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                ← Back to Order Details
              </button>
            </div>
          </div>
        )}

        {step === 'confirmation' && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <PackageCheck size={36} />
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Order Confirmed &amp; Verified
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-ink)' }}>
              Thank You For Your Order
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '20px' }}>
              Your order has been recorded and queued for warehouse picking and dispatch.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                maxWidth: '440px',
                margin: '0 auto 28px auto',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Order Reference:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{orderNumber || orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Delivery To:</span>
                <span style={{ fontWeight: 600 }}>{shippingDetails.contactName} ({shippingDetails.city})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Total Settled:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatNaira(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Dispatch Estimate:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Standard Courier Dispatch</span>
              </div>
            </div>

            <Button variant="primary" size="lg" onClick={onClose}>
              Return to Catalog
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
