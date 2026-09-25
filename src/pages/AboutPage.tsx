import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';

interface AboutPageProps {
  initialTab?: string;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onNavigateContact: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  initialTab = 'about',
  onNavigateHome,
  onNavigateShop,
  onNavigateContact,
}) => {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      {/* Breadcrumbs */}
      <nav style={{ padding: '20px 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
          Home
        </a>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>About EVYS</span>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: '800px', marginBottom: '40px' }}>
        <div className="section-eyebrow">Medical &amp; Laboratory Supply</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Professional healthcare supplies, made simple.
        </h1>
        <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
          EVYS supplies medical devices, laboratory equipment, and healthcare essentials for professionals, organisations, and individuals across the UK.
        </p>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <button
          type="button"
          className={`tab-btn ${tab === 'about' ? 'active' : ''}`}
          onClick={() => setTab('about')}
        >
          About EVYS
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'delivery' ? 'active' : ''}`}
          onClick={() => setTab('delivery')}
        >
          Delivery Information
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'returns' ? 'active' : ''}`}
          onClick={() => setTab('returns')}
        >
          Returns &amp; Support
        </button>
      </div>

      {/* Tab 1: About */}
      {tab === 'about' && (
        <div className="about-grid">
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '16px' }}>
              Reliable Equipment for Healthcare &amp; Research
            </h2>
            <p style={{ marginBottom: '16px', lineHeight: 1.7 }}>
              At EVYS, we focus on providing a clear, dependable, and efficient online buying experience for clinics, diagnostic laboratories, healthcare workers, and educational institutions.
            </p>
            <p style={{ marginBottom: '24px', lineHeight: 1.7 }}>
              Our curated product range spans diagnostic instruments, laboratory microscopy, everyday consumables, and medical apparel with transparent UK pricing.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Button variant="primary" size="lg" onClick={onNavigateShop}>
                Browse Catalogue
              </Button>
              <Button variant="secondary" size="lg" onClick={onNavigateContact}>
                Contact Support
              </Button>
            </div>
          </div>

          <div>
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
              alt="Medical Team"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--color-border)',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Delivery */}
      {tab === 'delivery' && (
        <div style={{ maxWidth: '840px', backgroundColor: 'var(--color-white)', padding: '36px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>UK Delivery Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: 1.7 }}>
            <p>
              We provide straightforward delivery for customers across the UK mainland.
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Orders over £50.00 ex. VAT:</strong> Free UK Mainland Delivery.</li>
              <li><strong>Orders under £50.00 ex. VAT:</strong> Standard £4.95 courier delivery.</li>
              <li>Estimated delivery times and express options are displayed during checkout.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Returns */}
      {tab === 'returns' && (
        <div style={{ maxWidth: '840px', backgroundColor: 'var(--color-white)', padding: '36px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>Returns &amp; Support</h2>
          <p style={{ lineHeight: 1.7, marginBottom: '16px' }}>
            Products in their original packaging may be returned within 30 days of receipt. Our customer support team is available to assist with return requests and product inquiries.
          </p>
        </div>
      )}
    </div>
  );
};
