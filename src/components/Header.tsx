import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, Menu, X, ChevronDown, Zap, ChevronRight, Phone, Mail, FileText, ArrowRight } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MegaMenu } from './MegaMenu';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { MEGA_MENU_CATEGORIES } from '../data/categories';

interface HeaderProps {
  activePage: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectProduct: (product: Product) => void;
  onOpenAccount: () => void;
  onOpenQuickOrder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  onSelectProduct,
  onOpenAccount,
  onOpenQuickOrder,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isShopAccordionOpen, setIsShopAccordionOpen] = useState(true);
  const [openSubAccordion, setOpenSubAccordion] = useState<string | null>(null);
  const { setIsCartOpen, totalItems } = useCart();

  // Sticky header shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (page: string, params?: Record<string, any>) => {
    onNavigate(page, params);
    setIsMobileMenuOpen(false);
    setIsMegaMenuOpen(false);
  };

  const toggleSubAccordion = (categoryId: string) => {
    setOpenSubAccordion(openSubAccordion === categoryId ? null : categoryId);
  };

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container" style={{ position: 'relative' }}>
        <div className="header-inner">
          {/* Brand Logo with EVYS branding */}
          <a
            href="#home"
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
            aria-label="EVYS Medical Homepage"
          >
            <img
              src="/evys-logo.png"
              alt="EVYS Logo"
              style={{
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="logo-text-wrap">
              <span className="logo-name" style={{ letterSpacing: '0.04em' }}>
                EVYS <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>MEDICAL</span>
              </span>
              <span className="logo-tagline">Medical &amp; Laboratory Supplies</span>
            </div>
          </a>

          {/* Desktop Navigation with Mega Menu Trigger */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            {/* Shop Catalogue with Mega Menu */}
            <div
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              style={{ position: 'static' }}
            >
              <button
                type="button"
                className={`nav-link ${activePage === 'shop' ? 'active' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  padding: '8px 4px',
                }}
                onClick={() => {
                  handleNavClick('shop');
                  setIsMegaMenuOpen(false);
                }}
                aria-expanded={isMegaMenuOpen}
                aria-haspopup="true"
              >
                <span>Shop Catalogue</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: isMegaMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 200ms ease',
                  }}
                />
              </button>
            </div>

            <a
              href="#about"
              className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('about');
              }}
            >
              About
            </a>

            <a
              href="#contact"
              className={`nav-link ${activePage === 'contact' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('contact');
              }}
            >
              Contact
            </a>
          </nav>

          {/* Right Header Actions (Search, Quick Order, Account, Cart, Mobile Toggle) */}
          <div className="header-actions">
            {/* Search Bar */}
            <SearchBar
              onSelectProduct={onSelectProduct}
              onViewAllResults={(query) => handleNavClick('shop', { search: query })}
              onSelectCategory={(catId) => handleNavClick('shop', { category: catId })}
            />

            {/* Quick Order Button */}
            <button
              type="button"
              className="btn btn-sm btn-secondary quick-order-header-btn"
              onClick={onOpenQuickOrder}
              title="Quick Order by SKU"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderColor: 'var(--color-border)',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              <Zap size={14} style={{ color: 'var(--color-primary)' }} />
              <span>Quick Order</span>
            </button>

            {/* Account Link */}
            <button
              type="button"
              className="action-btn"
              onClick={onOpenAccount}
              title="Account & Orders"
              aria-label="Account and orders"
            >
              <User size={19} />
            </button>

            {/* Cart Button with Count Badge */}
            <button
              type="button"
              className="action-btn"
              onClick={() => setIsCartOpen(true)}
              title="View Shopping Basket"
              aria-label={`Shopping basket with ${totalItems} items`}
            >
              <ShoppingBag size={19} />
              {totalItems > 0 && <span className="cart-counter-badge">{totalItems}</span>}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Desktop Mega Menu Dropdown */}
        <MegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onSelectCategory={(catId) => handleNavClick('shop', { category: catId })}
          onSelectSubcategory={(catId, subId) => handleNavClick('shop', { category: catId, subcategory: subId })}
          onOpenQuickOrder={onOpenQuickOrder}
        />

        {/* Mobile Navigation Drawer Backdrop & Panel */}
        {isMobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(11, 23, 38, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 90,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxHeight: '100%',
                backgroundColor: 'var(--color-white)',
                overflowY: 'auto',
                padding: '20px 16px 36px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'var(--shadow-xl)',
                borderBottom: '2px solid var(--color-primary)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Search Bar */}
              <div>
                <SearchBar
                  onSelectProduct={(p) => {
                    setIsMobileMenuOpen(false);
                    onSelectProduct(p);
                  }}
                  onViewAllResults={(query) => handleNavClick('shop', { search: query })}
                  onSelectCategory={(catId) => handleNavClick('shop', { category: catId })}
                />
              </div>

              {/* Primary Mobile Menu Links & Department Accordions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Shop Catalogue Accordion */}
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsShopAccordionOpen(!isShopAccordionOpen)}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'none',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: activePage === 'shop' ? 'var(--color-primary)' : 'var(--color-ink)',
                      cursor: 'pointer',
                      backgroundColor: isShopAccordionOpen ? 'var(--color-bg)' : 'transparent',
                    }}
                  >
                    <span>Shop Catalogue</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: isShopAccordionOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 200ms ease',
                      }}
                    />
                  </button>

                  {isShopAccordionOpen && (
                    <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleNavClick('shop')}
                        style={{
                          minHeight: '40px',
                          textAlign: 'left',
                          padding: '8px 10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>View All Products (303 items)</span>
                        <ArrowRight size={13} />
                      </button>

                      {MEGA_MENU_CATEGORIES.map((cat) => {
                        const isSubOpen = openSubAccordion === cat.id;
                        return (
                          <div
                            key={cat.id}
                            style={{
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSubAccordion(cat.id)}
                              style={{
                                width: '100%',
                                minHeight: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                background: 'none',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: 'var(--color-ink)',
                                cursor: 'pointer',
                              }}
                            >
                              <span>{cat.name}</span>
                              <ChevronDown
                                size={14}
                                style={{
                                  transform: isSubOpen ? 'rotate(180deg)' : 'none',
                                  transition: 'transform 200ms ease',
                                }}
                              />
                            </button>

                            {isSubOpen && (
                              <div
                                style={{
                                  padding: '6px 12px 10px 12px',
                                  backgroundColor: 'var(--color-bg)',
                                  borderTop: '1px solid var(--color-border)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleNavClick('shop', { category: cat.id })}
                                  style={{
                                    minHeight: '36px',
                                    textAlign: 'left',
                                    padding: '6px 0',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    color: 'var(--color-primary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  View All {cat.name} →
                                </button>
                                {cat.subcategories.map((sub) => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => handleNavClick('shop', { category: cat.id, subcategory: sub.id })}
                                    style={{
                                      minHeight: '38px',
                                      textAlign: 'left',
                                      padding: '6px 0',
                                      fontSize: '0.8125rem',
                                      color: 'var(--color-ink)',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                  >
                                    <span style={{ color: 'var(--color-muted)' }}>•</span>
                                    <span>{sub.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* About Link */}
                <button
                  type="button"
                  onClick={() => handleNavClick('about')}
                  style={{
                    minHeight: '44px',
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: activePage === 'about' ? 'var(--color-primary-light)' : 'var(--color-white)',
                    color: activePage === 'about' ? 'var(--color-primary)' : 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  About EVYS
                </button>

                {/* Contact Link */}
                <button
                  type="button"
                  onClick={() => handleNavClick('contact')}
                  style={{
                    minHeight: '44px',
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: activePage === 'contact' ? 'var(--color-primary-light)' : 'var(--color-white)',
                    color: activePage === 'contact' ? 'var(--color-primary)' : 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  Contact &amp; Clinic Procurement
                </button>
              </div>

              {/* Dedicated Quick Action Shortcuts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
                  Procurement Actions
                </div>

                {/* Quick Order Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenQuickOrder();
                  }}
                  style={{
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: '1px solid rgba(8, 126, 139, 0.25)',
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={16} />
                  <span>Quick Order by SKU</span>
                </button>

                {/* Account & Orders */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAccount();
                  }}
                  style={{
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-ink)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  <User size={16} />
                  <span>My Account &amp; Order History</span>
                </button>

                {/* Shopping Basket */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  style={{
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-ink)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={16} />
                    <span>Shopping Basket</span>
                  </div>
                  {totalItems > 0 ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {totalItems} item{totalItems > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>0 items</span>
                  )}
                </button>
              </div>

              {/* Healthcare Order Support Card */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                  Practice Support &amp; Order Line
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Freephone:</span>
                  <a href="tel:08004567890" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    0800 456 7890
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Official Email:</span>
                  <a href="mailto:orders@mazimedics.co.uk" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                    orders@mazimedics.co.uk
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
