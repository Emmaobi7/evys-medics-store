import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, Lock, ArrowRight, Building2, PackageCheck, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { submitOrderToApi } from '../api/client';
import { Button } from '../components/Button';

interface CheckoutMockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted: () => void;
}

export const CheckoutMockModal: React.FC<CheckoutMockModalProps> = ({
  isOpen,
  onClose,
  onOrderCompleted,
}) => {
  const { cart, subtotal, estimatedShipping, total, clearCart } = useCart();
  const [step, setStep] = useState<'details' | 'confirmation'>('details');
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>('');

  // Generate a unique idempotency key when opening the modal
  useEffect(() => {
    if (isOpen) {
      idempotencyKeyRef.current = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setErrorMessage(null);
    }
  }, [isOpen]);

  const [shippingDetails, setShippingDetails] = useState({
    clinicName: '',
    contactName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    postcode: '',
    paymentMethod: 'invoice', // invoice, card, nhs-po
    poNumber: '',
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
      customerName: shippingDetails.contactName,
      customerEmail: shippingDetails.email,
      customerPhone: shippingDetails.phone,
      clinicName: shippingDetails.clinicName || undefined,
      poNumber: shippingDetails.poNumber || undefined,
      paymentMethod: (shippingDetails.paymentMethod === 'nhs-po' ? 'nhs_po' : 'invoice') as 'invoice' | 'nhs_po',
      shippingAddressLine1: shippingDetails.addressLine1,
      shippingCity: shippingDetails.city,
      shippingPostcode: shippingDetails.postcode,
      shippingCountry: 'United Kingdom',
      idempotencyKey: idempotencyKeyRef.current,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await submitOrderToApi(orderPayload);
      setOrderId(res.order.orderNumber);
      setStep('confirmation');
      clearCart();
      onOrderCompleted();
    } catch (err: any) {
      console.error('[Checkout] API order submission error:', err);
      // Display genuine error to the customer without clearing cart or creating fake success
      setErrorMessage(
        err.message || 'Unable to complete order dispatch. Please verify stock availability and your delivery details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const vat = subtotal * 0.2;
  const grandTotal = subtotal + estimatedShipping + vat;

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
          maxWidth: '720px',
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

        {step === 'details' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
              <Lock size={15} /> 256-BIT ENCRYPTED CLINICAL ORDER PORTAL
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
              Delivery &amp; Practice Information
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '20px' }}>
              Complete shipping details for medical supply dispatch.
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
                  <strong>Order could not be submitted:</strong> {errorMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Clinic / Practitioner details */}
              <div className="form-row-2col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Clinic / Practice / Institution Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Jude Healthcare Centre"
                    value={shippingDetails.clinicName}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, clinicName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Smith"
                    value={shippingDetails.contactName}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, contactName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address (for Dispatch &amp; VAT Receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="j.smith@clinic.com"
                    value={shippingDetails.email}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Courier Contact Telephone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 ... / Telephone"
                    value={shippingDetails.phone}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street Address, Building, Floor/Room"
                  value={shippingDetails.addressLine1}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, addressLine1: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '12px', boxSizing: 'border-box' }}
                />
                <div className="form-row-2col">
                  <input
                    type="text"
                    required
                    placeholder="Town / City"
                    value={shippingDetails.city}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Postal Code / Area"
                    value={shippingDetails.postcode}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, postcode: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Settlement method */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px' }}>
                  Billing &amp; Settlement Preference
                </label>
                <div className="form-row-2col">
                  <label
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      backgroundColor: shippingDetails.paymentMethod === 'invoice' ? 'var(--color-primary-light)' : 'var(--color-white)',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={shippingDetails.paymentMethod === 'invoice'}
                      onChange={() => setShippingDetails({ ...shippingDetails, paymentMethod: 'invoice' })}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>30-Day Clinical Invoice</span>
                  </label>
                  <label
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      backgroundColor: shippingDetails.paymentMethod === 'nhs-po' ? 'var(--color-primary-light)' : 'var(--color-white)',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={shippingDetails.paymentMethod === 'nhs-po'}
                      onChange={() => setShippingDetails({ ...shippingDetails, paymentMethod: 'nhs-po' })}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Purchase Order / Institutional PO</span>
                  </label>
                </div>
              </div>

              {/* Order total review */}
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                  <span>Items Subtotal (ex. VAT)</span>
                  <span style={{ fontWeight: 600 }}>£{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                  <span>Delivery</span>
                  <span style={{ fontWeight: 600 }}>{estimatedShipping === 0 ? 'FREE' : `£${estimatedShipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
                  <span>VAT (20%)</span>
                  <span style={{ fontWeight: 600 }}>£{vat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, borderTop: '1px dashed var(--color-border)', paddingTop: '8px', marginTop: '8px' }}>
                  <span>Grand Total (inc. VAT)</span>
                  <span style={{ color: 'var(--color-primary)' }}>£{grandTotal.toFixed(2)}</span>
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
                Place Order (£{grandTotal.toFixed(2)})
              </Button>
            </form>
          </div>
        ) : (
          /* Confirmation Screen */
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
              Order Confirmed
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Thank You For Your Order</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '20px' }}>
              Your order has been queued for warehouse picking and quality inspection.
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
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Delivery To:</span>
                <span style={{ fontWeight: 600 }}>{shippingDetails.contactName} ({shippingDetails.postcode})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>Dispatch Estimate:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Within 24 Hours</span>
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
