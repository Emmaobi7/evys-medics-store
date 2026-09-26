import React from 'react';
import { ShieldCheck, Truck, LockKeyhole, Headphones } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const trustPoints = [
    {
      icon: <ShieldCheck size={24} strokeWidth={2} />,
      title: 'Professional-grade products',
      description: 'Carefully selected equipment and healthcare essentials.',
    },
    {
      icon: <Truck size={24} strokeWidth={2} />,
      title: 'Reliable dispatch',
      description: 'Straightforward delivery for professional healthcare customers.',
    },
    {
      icon: <LockKeyhole size={24} strokeWidth={2} />,
      title: 'Secure purchasing',
      description: 'A clear and convenient online buying experience.',
    },
    {
      icon: <Headphones size={24} strokeWidth={2} />,
      title: 'Reliable support',
      description: 'Help when you need it from our dedicated support team.',
    },
  ];

  return (
    <section className="trust-section">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px auto' }}>
          <div className="section-eyebrow">Medical &amp; Laboratory Supplies</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
            Professional healthcare supplies, made simple.
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)' }}>
            Supplying medical, laboratory and healthcare essentials for clinics, research facilities, and organisations.
          </p>
        </div>

        <div className="trust-grid">
          {trustPoints.map((item, index) => (
            <div key={index} className="trust-card">
              <div className="trust-card-icon">{item.icon}</div>
              <div>
                <h4 className="trust-card-title">{item.title}</h4>
                <p className="trust-card-text">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
