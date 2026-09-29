import React, { useState } from 'react';
import { X, User, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { loginUser } from '../api/client';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onNavigateToAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginUser(email, password);
      if (typeof window !== 'undefined') {
        localStorage.setItem('evys_auth_token', res.token);
        localStorage.setItem('evys_auth_user', JSON.stringify(res.user));
      }
      showToast('Signed In', `Welcome, ${res.user.email} (${res.user.role})`);
      onClose();
      if (res.user.role === 'ADMIN' && onNavigateToAdmin) {
        onNavigateToAdmin();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify credentials.');
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

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            <User size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ink)' }}>
            Sign In to Your Account
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px' }}>
            Access customer procurement records or the administrator portal.
          </p>
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

        <form onSubmit={handleSubmitLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. admin@evysmedics.co.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9375rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-ink)' }}>
              Password
            </label>
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
            Sign In
          </Button>

          <div style={{
            marginTop: '8px',
            padding: '10px 12px',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.75rem',
            color: 'var(--color-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>Administrator access will automatically redirect to the <strong>Admin Management Console</strong>.</span>
          </div>
        </form>
      </div>
    </div>
  );
};
