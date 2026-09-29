import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { verifyPaystackPayment, initializePaystackPayment, PaystackVerifyApiResponse } from '../api/client';
import { useCart } from '../context/CartContext';
import { Button } from '../components/Button';
import { formatNaira } from '../utils/money';

interface PaystackCallbackPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onNavigateCart: () => void;
}

export const PaystackCallbackPage: React.FC<PaystackCallbackPageProps> = ({
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
}) => {
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PaystackVerifyApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reference, setReference] = useState<string>('');

  const executeVerification = async (ref: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await verifyPaystackPayment(ref);
      setVerificationResult(data);

      if (data.success && data.status === 'paid') {
        clearCart();
      }
    } catch (err: any) {
      console.error('[Paystack Callback Verification Error]:', err);
      setErrorMessage(
        err.message || 'Unable to verify payment with the transaction reference provided.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');

    if (!ref) {
      setLoading(false);
      setErrorMessage(
        'No transaction reference was provided in the callback URL. If you completed a payment, please check your email for confirmation.'
      );
      return;
    }

    setReference(ref);
    executeVerification(ref);
  }, []);

  const handleRetryPayment = async () => {
    if (!verificationResult?.orderNumber && !reference) return;

    setRetryingPayment(true);
    setErrorMessage(null);

    try {
      // Use orderNumber from verification result or reference format (pstk_EVS-ORD-XXX_ts)
      const targetOrder = verificationResult?.orderNumber || reference.split('_')[1];
      if (!targetOrder) {
        throw new Error('Unable to resolve order identifier for payment retry.');
      }

      const callbackUrl = `${window.location.origin}/checkout/callback`;
      const initRes = await initializePaystackPayment(targetOrder, callbackUrl);

      if (initRes.authorizationUrl) {
        window.location.href = initRes.authorizationUrl;
      } else {
        throw new Error('No authorization URL returned by payment gateway.');
      }
    } catch (err: any) {
      console.error('[Payment Retry Error]:', err);
      setErrorMessage(err.message || 'Unable to re-initialize payment. Please try again or contact support.');
      setRetryingPayment(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '80vh', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '640px',
          width: '100%',
          padding: '44px 36px',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* State 1: Verifying / Loading */}
        {loading && (
          <div>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                animation: 'spin 1.5s linear infinite',
              }}
            >
              <RefreshCw size={36} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '12px' }}>
              Verifying Your Payment
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 20px auto' }}>
              Communicating with Paystack to confirm settlement for reference{' '}
              <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                {reference || '...'}
              </code>
              . Please do not close or refresh this browser tab.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
              256-Bit SSL Encrypted Verification
            </div>
          </div>
        )}

        {/* State 2: Verified Successfully */}
        {!loading && verificationResult?.success && verificationResult?.status === 'paid' && (
          <div>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <CheckCircle2 size={42} />
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Payment Verified &amp; Order Confirmed
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
              Thank You For Your Order!
            </h2>

            <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginBottom: '28px' }}>
              Your payment has been settled successfully. A dispatch confirmation receipt has been queued.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                textAlign: 'left',
                marginBottom: '32px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-muted)' }}>Order Number:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>
                  {verificationResult.orderNumber}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-muted)' }}>Paystack Reference:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)' }}>
                  {verificationResult.reference}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-muted)' }}>Total Amount Paid:</span>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.125rem' }}>
                  {formatNaira(verificationResult.amount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', paddingTop: '10px', borderTop: '1px dashed var(--color-border)' }}>
                <span style={{ color: 'var(--color-muted)' }}>Fulfillment Status:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} /> Queued for Picking &amp; Dispatch
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <Button variant="primary" size="lg" onClick={onNavigateShop} icon={<ShoppingBag size={18} />}>
                Continue Shopping
              </Button>
              <Button variant="secondary" size="lg" onClick={onNavigateHome}>
                Return to Home
              </Button>
            </div>
          </div>
        )}

        {/* State 3: Payment Failed / Cancelled / Error */}
        {!loading && (!verificationResult || !verificationResult.success || verificationResult.status !== 'paid') && (
          <div>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <XCircle size={42} />
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Payment Not Completed
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '10px' }}>
              Unable to Verify Settlement
            </h2>

            <div
              style={{
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid #FECACA',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '28px',
                fontSize: '0.875rem',
                textAlign: 'left',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Gateway Notice:
              </div>
              <div>{errorMessage || verificationResult?.message || 'The payment was not finalized or was cancelled on Paystack.'}</div>
              {reference && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#991B1B' }}>
                  Transaction Reference: <code>{reference}</code>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px', margin: '0 auto' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={retryingPayment}
                onClick={handleRetryPayment}
                icon={<RefreshCw size={18} />}
              >
                Retry Payment for this Order
              </Button>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => executeVerification(reference)}
                icon={<ExternalLink size={16} />}
              >
                Re-check Verification Status
              </Button>

              <Button variant="outline-teal" size="md" fullWidth onClick={onNavigateCart}>
                Return to Basket
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
