import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === 'warning' ? (
            <AlertTriangle size={20} style={{ color: '#F79009', flexShrink: 0 }} />
          ) : toast.type === 'info' ? (
            <Info size={20} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={20} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          )}

          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--color-white)' }}>{toast.title}</div>
            {toast.message && (
              <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginTop: '2px' }}>
                {toast.message}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
