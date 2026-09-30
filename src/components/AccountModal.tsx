import React, { useState } from 'react';
import { X, User, ArrowRight, ShieldCheck, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { loginUser, registerUser, requestPasswordReset } from '../api/client';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
  initialMode?: 'login' | 'register' | 'forgot_password';
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAdmin,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setForgotSubmitted(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (mode === 'forgot_password') {
      try {
        await requestPasswordReset(email.trim(), window.location.origin);
        setForgotSubmitted(true);
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to process reset request. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res =
        mode === 'login'
          ? await loginUser(email, password)
          : await registerUser(email, password);

      if (typeof window !== 'undefined') {
        localStorage.setItem('evys_auth_token', res.token);
        localStorage.setItem('evys_auth_user', JSON.stringify(res.user));
      }

      showToast(
        mode === 'login' ? 'Signed In' : 'Account Created',
        `Welcome, ${res.user.email}!`
      );
      onClose();

      if (res.user.role === 'ADMIN' && onNavigateToAdmin) {
        onNavigateToAdmin();
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (mode === 'login'
            ? 'Invalid email or password. Please verify credentials.'
            : 'Unable to create account. Please verify details.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 23, 38, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 150,
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
          maxWidth: '440px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          padding: '32px',
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

        {mode === 'forgot_password' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <KeyRound size={24} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                Reset Your Password
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                Enter your email address to receive password reset instructions.
              </p>
            </div>

            {forgotSubmitted ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    backgroundColor: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    border: '1px solid #BBF7D0',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
                    <CheckCircle2 size={18} />
                    <span>Instructions Dispatched</span>
                  </div>
                  If an account exists for <strong>{email}</strong>, a reset link has been dispatched. Please check your inbox and <strong>Spam / Junk folder</strong>.
                </div>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setMode('login');
                    setForgotSubmitted(false);
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {errorMessage && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--color-danger-bg, #FEF2F2)',
                      color: 'var(--color-danger, #DC2626)',
                      border: '1px solid #FECACA',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  type="submit"
                  isLoading={isLoading}
                  icon={<ArrowRight size={18} />}
                >
                  Send Reset Link
                </Button>

                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                {mode === 'login' ? <User size={24} /> : <UserPlus size={24} />}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                {mode === 'login' ? 'Sign In to Your Account' : 'Create Customer Account'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                {mode === 'login'
                  ? 'Access your orders, track shipments, or sign in as administrator.'
                  : 'Create an account to securely finalize orders and track deliveries.'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mode === 'login' ? 'var(--color-white)' : 'transparent',
                  color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-muted)',
                  boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mode === 'register' ? 'var(--color-white)' : 'transparent',
                  color: mode === 'register' ? 'var(--color-primary)' : 'var(--color-muted)',
                  boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-danger-bg, #FEF2F2)',
                  color: 'var(--color-danger, #DC2626)',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  marginBottom: '16px',
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                    Password * {mode === 'register' && <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>(min 6 characters)</span>}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setErrorMessage(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                type="submit"
                isLoading={isLoading}
                icon={<ArrowRight size={18} />}
              >
                {mode === 'login' ? 'Sign In' : 'Create Account & Sign In'}
              </Button>

              <div
                style={{
                  marginTop: '6px',
                  padding: '10px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>
                  {mode === 'login'
                    ? 'Administrator accounts will automatically open the Admin Console.'
                    : 'Your email address will be used for Paystack order confirmation receipts.'}
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
