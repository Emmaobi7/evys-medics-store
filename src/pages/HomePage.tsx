import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Microscope, Stethoscope, Zap, Package, ShoppingBag } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { fetchProducts } from '../api/client';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProductGrid } from '../components/ProductGrid';
import { TrustSection } from '../components/TrustSection';
import { Button } from '../components/Button';
import { Product } from '../types';
import { formatNaira } from '../utils/money';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onOpenQuickOrder: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectProduct,
  onQuickView,
  onOpenQuickOrder,
}) => {
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchProducts({ limit: 20 })
      .then((res) => {
        if (isMounted) {
          setProductsList(res.items || []);
        }
      })
      .catch((err) => {
        console.warn('[HomePage] API fetch error:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredProducts = productsList.filter((p) => p.isFeatured).length > 0
    ? productsList.filter((p) => p.isFeatured).slice(0, 8)
    : productsList.slice(0, 8);
  const promoEssentials = productsList.filter((p) => p.isPromoEssential || p.inStock).length > 0
    ? productsList.filter((p) => p.isPromoEssential || p.inStock).slice(0, 4)
    : productsList.slice(0, 4);

  return (
    <div>
      {/* 3. Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-pill-badge">
                <span>Medical &amp; Laboratory Supplies</span>
              </div>

              <h1 className="hero-title">
                Medical supplies. <br />
                <span>Delivered with confidence.</span>
              </h1>

              <p className="hero-subtitle">
                Professional medical, laboratory and healthcare essentials for clinics, research laboratories, and organisations.
              </p>

              <div className="hero-cta-group">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight size={18} />}
                  onClick={() => onNavigate('shop')}
                >
                  Shop products
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('featured-categories');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Browse categories
                </Button>

                <Button
                  variant="outline-teal"
                  size="lg"
                  icon={<Zap size={18} />}
                  onClick={onOpenQuickOrder}
                >
                  Quick Order by SKU
                </Button>
              </div>

              <div className="hero-trust-badges">
                <div className="hero-trust-item">
                  <CheckCircle2 size={18} />
                  <span>Reliable delivery &amp; dispatch</span>
                </div>
                <div className="hero-trust-item">
                  <CheckCircle2 size={18} />
                  <span>Professional-grade products</span>
                </div>
                <div className="hero-trust-item">
                  <CheckCircle2 size={18} />
                  <span>Straightforward online ordering</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Right */}
            <div className="hero-visual-card">
              <div className="hero-image-frame">
                <img
                  src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=85"
                  alt="Precision Medical and Laboratory Equipment"
                />
              </div>

              {/* Floating Highlight 1 */}
              <div className="hero-floating-card top-right">
                <div className="floating-icon">
                  <Microscope size={20} />
                </div>
                <div>
                  <div className="floating-title">Laboratory Precision</div>
                  <div className="floating-desc">Instruments &amp; Consumables</div>
                </div>
              </div>

              {/* Floating Highlight 2 */}
              <div className="hero-floating-card bottom-left">
                <div className="floating-icon">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <div className="floating-title">Clinical Equipment</div>
                  <div className="floating-desc">Diagnostic &amp; Practice Supplies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Categories Section */}
      <section id="featured-categories" className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Product Catalogues</div>
              <h2 className="section-title">Featured Categories</h2>
              <p className="section-subtitle">
                Browse our core departments across medical hardware, laboratory apparatus, consumables, and uniforms.
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              icon={<ArrowRight size={16} />}
              onClick={() => onNavigate('shop')}
            >
              View all supplies
            </Button>
          </div>

          <CategoryGrid
            categories={CATEGORIES}
            onSelectCategory={(catId) => onNavigate('shop', { category: catId })}
          />
        </div>
      </section>

      {/* 5. Featured Products Grid */}
      {featuredProducts.length > 0 && (
        <section className="section" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">Professional Selection</div>
                <h2 className="section-title">Featured Products</h2>
                <p className="section-subtitle">
                  In-demand clinical devices, examination supplies, and laboratory instruments ready for dispatch.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline-teal"
                  size="sm"
                  onClick={() => onNavigate('shop', { badge: 'Bestseller' })}
                >
                  Bestsellers
                </Button>
                <Button
                  variant="outline-teal"
                  size="sm"
                  onClick={() => onNavigate('shop', { badge: 'Popular' })}
                >
                  Popular Items
                </Button>
              </div>
            </div>

            <ProductGrid
              products={featuredProducts}
              onSelectProduct={onSelectProduct}
              onQuickView={onQuickView}
            />
          </div>
        </section>
      )}

      {/* 1. Established Trust Section */}
      <TrustSection />

      {/* 7. Promotional / Product Collection Spotlight */}
      <section className="section" style={{ padding: '40px 0', backgroundColor: 'var(--color-bg)' }}>
        <div className="container">
          <div className="promo-banner">
            <div className="promo-grid">
              <div className="promo-content">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(24, 166, 184, 0.2)',
                    color: 'var(--color-accent)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '16px',
                  }}
                >
                  Essential Supplies
                </span>
                <h2>Equip Your Organisation with Reliable Supplies</h2>
                <p>
                  From single-use clinical consumables to precision laboratory apparatus, Evy's Projects supplies dependable products for healthcare environments, research laboratories, and professionals.
                </p>

                <div className="promo-perks-list">
                  <div className="promo-perk">
                    <CheckCircle2 size={16} /> Transparent Pricing
                  </div>
                  <div className="promo-perk">
                    <CheckCircle2 size={16} /> Tracked Dispatch &amp; Delivery
                  </div>
                  <div className="promo-perk">
                    <CheckCircle2 size={16} /> Direct SKU Quick Ordering
                  </div>
                  <div className="promo-perk">
                    <CheckCircle2 size={16} /> Dedicated Customer Support
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<Package size={18} />}
                    onClick={() => onNavigate('shop')}
                  >
                    Explore Full Catalogue
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    onClick={onOpenQuickOrder}
                  >
                    Quick Order by SKU
                  </Button>
                </div>
              </div>

              {/* Spotlight Product Mini Grid */}
              {promoEssentials.length > 0 && (
                <div className="promo-mini-grid">
                  {promoEssentials.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectProduct(p)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        color: 'var(--color-ink)',
                        transition: 'transform 200ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'contain',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#F8FAFC',
                          marginBottom: '8px',
                        }}
                      />
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 700 }}>
                        {p.sku}
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                        {formatNaira(p.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Bottom CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>Ready to stock your practice?</h2>
            <p>
              Explore our full range of medical and laboratory supplies with straightforward ordering and reliable delivery.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} />}
                onClick={() => onNavigate('shop')}
              >
                Shop all products
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('contact')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
