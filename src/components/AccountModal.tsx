import React, { useState } from 'react';
import { X, Building2, User, KeyRound, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { loginUser } from '../api/client';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onNavigateToAdmin }) => {
  const [tab, setTab] = useState<'login' | 'nhs'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nhsTrust, setNhsTrust] = useState('');
  const [poNumber, setPoNumber] = useState('');
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
      showToast('Signed In', `Welcome back, ${res.user.email} (${res.user.role})`);
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

  const handleSubmitNHS = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Account Verified', `Institutional credit active for ${nhsTrust || 'Healthcare Facility'}`);
    onClose();
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
          maxWidth: '480px',
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Account &amp; Institutional Access</h2>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
            Manage clinic re-orders, institutional purchase orders, and invoices.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: tab === 'login' ? 'var(--color-white)' : 'transparent',
              color: tab === 'login' ? 'var(--color-ink)' : 'var(--color-muted)',
              boxShadow: tab === 'login' ? 'var(--shadow-sm)' : 'none',
            }}
            onClick={() => setTab('login')}
          >
            Practitioner Login
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: tab === 'nhs' ? 'var(--color-white)' : 'transparent',
              color: tab === 'nhs' ? 'var(--color-ink)' : 'var(--color-muted)',
              boxShadow: tab === 'nhs' ? 'var(--shadow-sm)' : 'none',
            }}
            onClick={() => setTab('nhs')}
          >
            Institutional Portal
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

        {tab === 'login' ? (
          <form onSubmit={handleSubmitLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Professional Email Address
              </label>
              <input
                type="email"
                required
                placeholder="doctor@clinic.com"
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
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
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
              Sign In to Medical Account
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitNHS} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Healthcare Organisation / Facility
              </label>
              <input
                type="text"
                required
                placeholder="e.g. City Health Clinic & Laboratory"
                value={nhsTrust}
                onChange={(e) => setNhsTrust(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Purchase Order / Official Procurement Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PO-2026-994"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9375rem',
                }}
              />
            </div>

            <Button variant="primary" size="lg" fullWidth type="submit" icon={<FileText size={18} />}>
              Lookup Purchase Order
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
