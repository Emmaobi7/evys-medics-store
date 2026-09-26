import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from 'lucide-react';
import { CATEGORIES } from '../data/categories';

interface FooterProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <div className="brand-logo" style={{ color: 'var(--color-white)' }}>
              <img
                src="/evys-logo.png"
                alt="Evy's Projects Logo"
                style={{
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'contain',
                }}
              />
              <div className="logo-text-wrap">
                <span className="logo-name" style={{ color: 'var(--color-white)', letterSpacing: '0.02em' }}>
                  Evy's <span style={{ color: 'var(--color-accent)' }}>PROJECTS</span>
                </span>
                <span className="logo-tagline" style={{ color: '#94A3B8' }}>
                  Medical &amp; Laboratory Supplies
                </span>
              </div>
            </div>

            <p>
              Supplying medical devices, laboratory equipment, and clinical consumables for healthcare professionals, institutions, and research laboratories.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1' }}>
                <Phone size={15} style={{ color: 'var(--color-accent)' }} />
                <span>Customer Support: 0800 456 7890</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1' }}>
                <Mail size={15} style={{ color: 'var(--color-accent)' }} />
                <span>support@evysprojects.com</span>
              </div>
            </div>
          </div>

          {/* Shop Col */}
          <div>
            <h4 className="footer-col-title">Shop Supplies</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#all" onClick={(e) => { e.preventDefault(); onNavigate('shop'); }}>
                  All Medical Supplies
                </a>
              </li>
              <li>
                <a href="#bestsellers" onClick={(e) => { e.preventDefault(); onNavigate('shop', { badge: 'Bestseller' }); }}>
                  Bestselling Essentials
                </a>
              </li>
              <li>
                <a href="#new" onClick={(e) => { e.preventDefault(); onNavigate('shop', { badge: 'New' }); }}>
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#quickorder" onClick={(e) => { e.preventDefault(); onNavigate('shop'); }}>
                  Quick Order by SKU
                </a>
              </li>
            </ul>
          </div>

          {/* Categories Col */}
          <div>
            <h4 className="footer-col-title">Categories</h4>
            <ul className="footer-links-list">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`#${cat.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('shop', { category: cat.id });
                    }}
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Col */}
          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }}>
                  About Evy's Projects
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}>
                  Contact &amp; Support
                </a>
              </li>
              <li>
                <a href="#delivery" onClick={(e) => { e.preventDefault(); onNavigate('about', { tab: 'delivery' }); }}>
                  Delivery Information
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#delivery" onClick={(e) => { e.preventDefault(); onNavigate('about', { tab: 'delivery' }); }}>
                  Delivery &amp; Dispatch Options
                </a>
              </li>
              <li>
                <a href="#returns" onClick={(e) => { e.preventDefault(); onNavigate('about', { tab: 'returns' }); }}>
                  Returns Policy
                </a>
              </li>
              <li>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigate('about', { tab: 'privacy' }); }}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigate('about', { tab: 'terms' }); }}>
                  Terms &amp; Conditions
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Evy's Projects. All rights reserved.
          </div>

          <div className="footer-socials">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="Twitter">
              <Twitter size={16} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="Facebook">
              <Facebook size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
