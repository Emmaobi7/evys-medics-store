import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, User, Menu, X, ChevronDown, Zap, ChevronRight, Phone, Mail, FileText, ArrowRight, ShieldCheck, LogOut } from 'lucide-react';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(60);
  const headerRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [authUser, setAuthUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('evys_auth_user');
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  });
  const { setIsCartOpen, totalItems } = useCart();

  useEffect(() => {
    const checkUser = () => {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('evys_auth_user');
        setAuthUser(raw ? JSON.parse(raw) : null);
      }
    };
    window.addEventListener('storage', checkUser);
    const interval = setInterval(checkUser, 1000);
    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Lock body scroll and measure header bottom when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setHeaderBottom(Math.round(rect.bottom));
      }
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
    <>
      <header ref={headerRef} className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container" style={{ position: 'relative' }}>
        <div className="header-inner">
          {/* Brand Logo with Evy's Projects branding */}
          <a
            href="#home"
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
            aria-label="Evy's Projects Homepage"
          >
            <img
              src="/evys-logo.png"
              alt="Evy's Projects Logo"
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
              <span className="logo-name" style={{ letterSpacing: '0.02em' }}>
                Evy's <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>PROJECTS</span>
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

            <a
              href="#admin"
              className={`nav-link ${activePage === 'admin' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('admin');
              }}
              style={{
                color: activePage === 'admin' ? 'var(--color-primary)' : 'inherit',
                fontWeight: activePage === 'admin' ? 700 : 500
              }}
            >
              Admin Portal
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

            {/* Admin Portal Direct Switcher Button (when authenticated as Admin) */}
            {authUser?.role === 'ADMIN' && (
              <button
                type="button"
                className="btn btn-sm desktop-only admin-switcher-header-btn"
                onClick={() => handleNavClick(activePage === 'admin' ? 'shop' : 'admin')}
                style={{
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: activePage === 'admin' ? '#f1f5f9' : '#012ea2',
                  color: activePage === 'admin' ? '#0f172a' : '#ffffff',
                  border: activePage === 'admin' ? '1px solid #cbd5e1' : 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                {activePage === 'admin' ? (
                  <>
                    <ShoppingBag size={14} />
                    <span>View Storefront</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Admin Portal</span>
                  </>
                )}
              </button>
            )}

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

            {/* Account Profile / Menu Popover */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="action-btn"
                onClick={() => {
                  if (authUser) {
                    setIsUserMenuOpen(!isUserMenuOpen);
                  } else {
                    onOpenAccount();
                  }
                }}
                title={authUser ? `Signed in as ${authUser.email}` : 'Sign In / Account'}
                aria-label="Account and orders"
                style={{
                  position: 'relative',
                  backgroundColor: authUser ? '#f0fdf4' : 'transparent',
                  color: authUser ? '#166534' : 'inherit',
                  borderColor: authUser ? '#bbf7d0' : 'transparent',
                }}
              >
                <User size={19} />
                {authUser && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                    }}
                  />
                )}
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && authUser && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '12px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Signed in as</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {authUser.email}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: authUser.role === 'ADMIN' ? '#EFF6FF' : '#f1f5f9',
                        color: authUser.role === 'ADMIN' ? '#012EA2' : '#475569',
                      }}
                    >
                      {authUser.role}
                    </span>
                  </div>

                  {authUser.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleNavClick('admin');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <ShieldCheck size={16} style={{ color: '#012EA2' }} />
                      <span>Admin Management</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('evys_auth_token');
                      localStorage.removeItem('evys_auth_user');
                      setAuthUser(null);
                      setIsUserMenuOpen(false);
                      handleNavClick('home');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#e11d48',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

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

        </div>
      </header>

      {/* Mobile Navigation Drawer Backdrop & Panel via Portal */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="mobile-nav-backdrop"
          style={{
            position: 'fixed',
            top: `${headerBottom}px`,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 23, 38, 0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="mobile-nav-panel"
            style={{
              width: '100%',
              maxHeight: `calc(100vh - ${headerBottom}px)`,
              backgroundColor: '#FFFFFF',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '16px 16px 40px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              borderBottom: '3px solid var(--color-primary)',
              boxSizing: 'border-box',
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
                About Evy's Projects
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

              {/* Admin Management Link in Mobile Drawer if Admin */}
              {authUser?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  style={{
                    minHeight: '44px',
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-primary)',
                    background: activePage === 'admin' ? 'var(--color-primary)' : 'var(--color-primary-light)',
                    color: activePage === 'admin' ? '#ffffff' : 'var(--color-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Admin Management Portal</span>
                </button>
              )}
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
                  border: '1px solid rgba(1, 46, 162, 0.25)',
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
                Practice Support &amp; Order Inquiries
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--color-muted)' }}>Support Channel:</span>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    onNavigate('contact');
                  }}
                  style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                >
                  Contact Support &amp; Inquiries
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
