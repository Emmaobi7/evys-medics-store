import React from 'react';

export const SkeletonProductCard: React.FC = () => {
  return (
    <div
      className="product-card skeleton-card"
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          backgroundColor: '#F0F3F6',
          animation: 'skeletonPulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        <div style={{ width: '40%', height: '12px', backgroundColor: '#E5E9EE', borderRadius: '4px' }} />
        <div style={{ width: '85%', height: '16px', backgroundColor: '#E5E9EE', borderRadius: '4px' }} />
        <div style={{ width: '60%', height: '14px', backgroundColor: '#E5E9EE', borderRadius: '4px' }} />
        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '35%', height: '18px', backgroundColor: '#E5E9EE', borderRadius: '4px' }} />
          <div style={{ width: '64px', height: '28px', backgroundColor: '#E5E9EE', borderRadius: 'var(--radius-sm)' }} />
        </div>
      </div>
    </div>
  );
};

export const SkeletonPDP: React.FC = () => {
  return (
    <div className="pdp-grid" aria-hidden="true" style={{ opacity: 0.8 }}>
      <div className="pdp-gallery">
        <div
          style={{
            backgroundColor: '#F0F3F6',
            borderRadius: 'var(--radius-xl)',
            aspectRatio: '1 / 1',
            border: '1px solid var(--color-border)',
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '30%', height: '14px', backgroundColor: '#E5E9EE', borderRadius: '4px' }} />
        <div style={{ width: '80%', height: '28px', backgroundColor: '#E5E9EE', borderRadius: '6px' }} />
        <div style={{ width: '45%', height: '16px', backgroundColor: '#E5E9EE', borderRadius: '4px' }} />
        <div
          style={{
            height: '68px',
            backgroundColor: '#F0F3F6',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        />
        <div style={{ width: '100%', height: '48px', backgroundColor: '#E5E9EE', borderRadius: '6px' }} />
        <div style={{ width: '100%', height: '44px', backgroundColor: '#E5E9EE', borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
  );
};
