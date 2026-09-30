import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '../components/Button';
import { resetPassword } from '../api/client';

interface ResetPasswordPageProps {
  onNavigateHome: () => void;
  onOpenSignIn: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onNavigateHome,
  onOpenSignIn,
}) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage('Reset token is missing. Please click the link in your reset email.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token.trim(), newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Failed to reset password. The link may have expired or already been used. Please request a new link.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        minHeight: '75vh',
        padding: '60px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '480px',
          width: '100%',
          padding: '40px 36px',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
        }}
      >
        {isSuccess ? (
          <div style={{ textAlign: 'center' }}>
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
              <CheckCircle2 size={40} />
            </div>

            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--color-success)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              Password Updated
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '10px' }}>
              Your Password Has Been Reset
            </h2>

            <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginBottom: '28px', lineHeight: 1.5 }}>
              You can now sign in to your Evy's Medics Store account using your new password.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onOpenSignIn}
                icon={<ArrowRight size={18} />}
              >
                Sign In Now
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={onNavigateHome}>
                Return to Home
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto',
                }}
              >
                <KeyRound size={26} />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '6px' }}>
                Set New Password
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                Enter your new password below to regain access to your account.
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: 'var(--color-danger-bg, #FEF2F2)',
                  color: 'var(--color-danger, #DC2626)',
                  border: '1px solid #FECACA',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  fontSize: '0.8125rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!token && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                    Reset Token *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Paste your 64-character reset token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                  New Password * <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>(min 6 characters)</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
                  Confirm New Password *
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

              <Button
                variant="primary"
                size="lg"
                fullWidth
                type="submit"
                isLoading={isLoading}
                icon={<ArrowRight size={18} />}
              >
                Update Password
              </Button>

              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={onOpenSignIn}
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
          </div>
        )}
      </div>
    </div>
  );
};
