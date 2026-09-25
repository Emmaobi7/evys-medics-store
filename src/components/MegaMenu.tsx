import React, { useEffect, useRef } from 'react';
import { ArrowRight, ChevronRight, Zap, Truck, ShieldCheck, Stethoscope, Microscope, Package, Sparkles } from 'lucide-react';
import { MEGA_MENU_CATEGORIES } from '../data/categories';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string, subcategoryId?: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string) => void;
  onOpenQuickOrder?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'medical-equipment': <Stethoscope size={16} />,
  'laboratory': <Microscope size={16} />,
  'medical-consumables': <Package size={16} />,
  'medical-apparel': <Sparkles size={16} />,
};

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  onSelectSubcategory,
  onOpenQuickOrder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="mega-menu-container"
      onMouseLeave={onClose}
      role="region"
      aria-label="Shop Catalogue Mega Menu"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 55,
        animation: 'megaMenuFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="container" style={{ padding: '28px 24px 20px 24px' }}>
        {/* 4 Core Department Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {MEGA_MENU_CATEGORIES.map((cat, idx) => (
            <div
              key={cat.id}
              style={{
                paddingRight: idx < MEGA_MENU_CATEGORIES.length - 1 ? '16px' : '0',
                borderRight: idx < MEGA_MENU_CATEGORIES.length - 1 ? '1px solid var(--color-border)' : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Department Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  color: 'var(--color-primary)',
                }}
              >
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_ICONS[cat.id] || <ChevronRight size={14} />}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onClose();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink)')}
                >
                  {cat.name}
                </button>
              </div>

              {/* Department brief descriptor */}
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                  lineHeight: 1.4,
                  marginBottom: '12px',
                  minHeight: '2.1em',
                }}
              >
                {cat.description}
              </p>

              {/* Subcategories List */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0, padding: 0 }}>
                {cat.subcategories.map((sub) => (
                  <li key={sub.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSubcategory(cat.id, sub.id);
                        onClose();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: 'var(--color-ink)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        transition: 'all 120ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                        e.currentTarget.style.paddingLeft = '12px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-ink)';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                    >
                      <span>{sub.name}</span>
                      <ChevronRight size={12} style={{ opacity: 0.4 }} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* View all in category link */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onClose();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 8px 0 8px',
                  marginTop: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View all {cat.name}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Mature Supplier Bottom Utility Bar */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--color-muted)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink)', fontWeight: 600 }}>
              <Truck size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Free UK Mainland Delivery over £50</span>
            </span>
            <span style={{ color: 'var(--color-border-dark)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Verified Clinical &amp; Laboratory Standards</span>
            </span>
            {onOpenQuickOrder && (
              <>
                <span style={{ color: 'var(--color-border-dark)' }}>•</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickOrder();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Zap size={14} />
                  <span>Direct SKU Quick Order</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-teal"
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={() => {
              onSelectCategory('all');
              onClose();
            }}
          >
            <span>Browse Full Product Catalogue (303 items)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
