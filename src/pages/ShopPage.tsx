import React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Search, RotateCcw, X, ChevronRight, Check } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { CATEGORIES, MEGA_MENU_CATEGORIES } from '../data/categories';
import { fetchProducts } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { Button } from '../components/Button';
import { Product, FilterState } from '../types';
import { formatNaira } from '../utils/money';

interface ShopPageProps {
  initialCategory?: string;
  initialSubcategory?: string;
  initialSearch?: string;
  initialBadge?: string;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigateHome: () => void;
  onOpenQuickOrder?: () => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory = 'all',
  initialSubcategory = 'all',
  initialSearch = '',
  initialBadge = '',
  onSelectProduct,
  onQuickView,
  onNavigateHome,
  onOpenQuickOrder,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    subcategory: initialSubcategory,
    productType: 'all',
    brand: 'all',
    searchQuery: initialSearch,
    minPrice: 0,
    maxPrice: 10000000,
    inStockOnly: false,
    sortBy: 'relevance',
    badgeFilter: initialBadge,
  });

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Live API Fetch for Products
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchProducts({
      category: filters.category,
      subcategory: filters.subcategory,
      brand: filters.brand,
      productType: filters.productType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStockOnly: filters.inStockOnly,
      sortBy: filters.sortBy,
      searchQuery: filters.searchQuery,
      limit: 50,
    })
      .then((res) => {
        if (isMounted && res.items) {
          setProductsList(res.items);
        }
      })
      .catch((err) => {
        console.warn('[ShopPage] API error, falling back to cached catalog:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    filters.category,
    filters.subcategory,
    filters.brand,
    filters.productType,
    filters.minPrice,
    filters.maxPrice,
    filters.inStockOnly,
    filters.sortBy,
    filters.searchQuery,
  ]);

  // Available brands in data
  const availableBrands = useMemo(() => {
    const brands = productsList
      .filter((p) => filters.category === 'all' || p.category === filters.category)
      .map((p) => p.brand)
      .filter((b): b is string => Boolean(b));
    return Array.from(new Set(brands));
  }, [filters.category, productsList]);

  // Available product types based on current category selection
  const availableProductTypes = useMemo(() => {
    const list = productsList
      .filter((p) => filters.category === 'all' || p.category === filters.category)
      .map((p) => p.productType)
      .filter((t): t is string => Boolean(t));
    return Array.from(new Set(list));
  }, [filters.category, productsList]);

  // Filter & Sort Products (Client-side fallback/refinement)
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      if (filters.badgeFilter && product.badge !== filters.badgeFilter) {
        return false;
      }
      return true;
    });
  }, [productsList, filters.badgeFilter]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      subcategory: 'all',
      productType: 'all',
      brand: 'all',
      searchQuery: '',
      minPrice: 0,
      maxPrice: 10000000,
      inStockOnly: false,
      sortBy: 'relevance',
      badgeFilter: '',
    });
  };

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === filters.category);
  const selectedMegaCat = MEGA_MENU_CATEGORIES.find((c) => c.id === filters.category);

  return (
    <div className="container" style={{ paddingBottom: '64px' }}>
      {/* Breadcrumbs */}
      <nav style={{ padding: '20px 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
          Home
        </a>
        <ChevronRight size={14} />
        <a
          href="#shop"
          onClick={(e) => {
            e.preventDefault();
            setFilters((f) => ({ ...f, category: 'all', subcategory: 'all', brand: 'all', productType: 'all' }));
          }}
        >
          Shop Catalogue
        </a>
        {selectedCategoryObj && (
          <>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{selectedCategoryObj.name}</span>
          </>
        )}
      </nav>

      {/* Category or Search Results Landing Header */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ maxWidth: '800px', marginBottom: filters.searchQuery ? '12px' : '20px' }}>
          <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>
            {filters.searchQuery
              ? 'Search Results'
              : selectedCategoryObj
              ? 'Supplier Discipline'
              : 'Catalogue Overview'}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
            {filters.searchQuery
              ? `Results for "${filters.searchQuery}"`
              : selectedCategoryObj
              ? selectedCategoryObj.name
              : 'Medical & Laboratory Supplies'}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
            {filters.searchQuery
              ? `Showing ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} matching your search query in the Evy's Projects catalogue.`
              : selectedCategoryObj
              ? selectedCategoryObj.description
              : 'Supplying clinical equipment, diagnostic devices, sterile consumables, and laboratory apparatus.'}
          </p>
        </div>

        {/* If search query is active, provide a clear search quick button */}
        {filters.searchQuery ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '8px' }}>
            <Button
              variant="outline-teal"
              size="sm"
              icon={<X size={14} />}
              onClick={() => setFilters({ ...filters, searchQuery: '' })}
            >
              Clear Search Query
            </Button>
            {onOpenQuickOrder && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenQuickOrder}
              >
                Search by SKU in Quick Order
              </Button>
            )}
          </div>
        ) : selectedMegaCat ? (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '8px' }}>
              Subcategories in {selectedMegaCat.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, subcategory: 'all' })}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  backgroundColor: filters.subcategory === 'all' ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: filters.subcategory === 'all' ? 'var(--color-white)' : 'var(--color-ink)',
                  transition: 'all 150ms ease',
                }}
              >
                All {selectedMegaCat.name}
              </button>
              {selectedMegaCat.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setFilters({ ...filters, subcategory: sub.id })}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    backgroundColor: filters.subcategory === sub.id ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: filters.subcategory === sub.id ? 'var(--color-white)' : 'var(--color-ink)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '8px' }}>
              Primary Categories
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilters({ ...filters, category: cat.id, subcategory: 'all' })}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{cat.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-muted)' }}>({cat.itemCount})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Active filters count, mobile filter trigger, and Sorting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          Showing <strong>{displayedProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm mobile-filter-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <SlidersHorizontal size={16} />
            <span>Filters ({filteredProducts.length})</span>
          </button>

          {/* 3. Sorting Options (Relevance, Price: Low to High, Price: High to Low, Name: A-Z) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-white)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-ink)',
                cursor: 'pointer',
              }}
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {(filters.category !== 'all' || filters.subcategory !== 'all' || filters.productType !== 'all' || filters.brand !== 'all' || filters.searchQuery || filters.inStockOnly || filters.maxPrice < 600) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Active filters:</span>
          {filters.category !== 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              Category: {selectedCategoryObj?.name}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilters({ ...filters, category: 'all', subcategory: 'all' })} />
            </span>
          )}
          {filters.subcategory !== 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              Subcategory: {filters.subcategory}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilters({ ...filters, subcategory: 'all' })} />
            </span>
          )}
          {filters.productType !== 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              Type: {filters.productType}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilters({ ...filters, productType: 'all' })} />
            </span>
          )}
          {filters.brand !== 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              Brand: {filters.brand}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilters({ ...filters, brand: 'all' })} />
            </span>
          )}
          {filters.searchQuery && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              Search: "{filters.searchQuery}"
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilters({ ...filters, searchQuery: '' })} />
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '8px',
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Shop Grid & Desktop Sidebar */}
      <div className="shop-layout">
        <aside className="shop-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Filter Catalogue</span>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          {/* 1. Category */}
          <div className="sidebar-section">
            <div className="sidebar-title">Category</div>
            <ul className="filter-list">
              <li>
                <label className="filter-label">
                  <span>
                    <input
                      type="radio"
                      name="category"
                      checked={filters.category === 'all'}
                      onChange={() => setFilters({ ...filters, category: 'all', subcategory: 'all', productType: 'all', brand: 'all' })}
                    />
                    All Categories
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>({PRODUCTS.length})</span>
                </label>
              </li>
              {CATEGORIES.map((cat) => {
                const count = PRODUCTS.filter((p) => p.category === cat.id).length;
                return (
                  <li key={cat.id}>
                    <label className="filter-label">
                      <span>
                        <input
                          type="radio"
                          name="category"
                          checked={filters.category === cat.id}
                          onChange={() => setFilters({ ...filters, category: cat.id, subcategory: 'all', productType: 'all', brand: 'all' })}
                        />
                        {cat.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>({count})</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 2. Availability */}
          <div className="sidebar-section">
            <div className="sidebar-title">Availability</div>
            <label className="filter-label">
              <span>
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
                />
                In Stock Only
              </span>
            </label>
          </div>

          {/* 3. Price */}
          <div className="sidebar-section">
            <div className="sidebar-title">Price Range</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
              <span>{formatNaira(filters.minPrice)}</span>
              <span>{formatNaira(filters.maxPrice)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="600"
              step="10"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </div>

          {/* 4. Brand (if brands exist in mock data) */}
          {availableBrands.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-title">Brand</div>
              <ul className="filter-list">
                <li>
                  <label className="filter-label">
                    <span>
                      <input
                        type="radio"
                        name="brand"
                        checked={filters.brand === 'all'}
                        onChange={() => setFilters({ ...filters, brand: 'all' })}
                      />
                      All Brands
                    </span>
                  </label>
                </li>
                {availableBrands.map((brand) => (
                  <li key={brand}>
                    <label className="filter-label">
                      <span>
                        <input
                          type="radio"
                          name="brand"
                          checked={filters.brand === brand}
                          onChange={() => setFilters({ ...filters, brand })}
                        />
                        {brand}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Product Type */}
          {availableProductTypes.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-title">Product Type</div>
              <ul className="filter-list">
                <li>
                  <label className="filter-label">
                    <span>
                      <input
                        type="radio"
                        name="productType"
                        checked={filters.productType === 'all'}
                        onChange={() => setFilters({ ...filters, productType: 'all' })}
                      />
                      All Types
                    </span>
                  </label>
                </li>
                {availableProductTypes.map((type) => (
                  <li key={type}>
                    <label className="filter-label">
                      <span>
                        <input
                          type="radio"
                          name="productType"
                          checked={filters.productType === type}
                          onChange={() => setFilters({ ...filters, productType: type })}
                        />
                        {type}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Product Grid & Pagination / Empty State */}
        <div>
          {filteredProducts.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <Search size={30} />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
                No products found
              </h2>

              <p style={{ maxWidth: '480px', margin: '0 auto 24px auto', fontSize: '0.9375rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                {filters.searchQuery
                  ? `We couldn't find any medical or laboratory products matching "${filters.searchQuery}". Try checking your spelling, using broader search terms, or enter a product SKU in Quick Order.`
                  : 'No products match your current combination of filters. Try clearing or relaxing some filters.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleResetFilters}
                >
                  Clear Filters &amp; Show All
                </Button>

                {onOpenQuickOrder && (
                  <Button
                    variant="outline-teal"
                    size="md"
                    onClick={onOpenQuickOrder}
                  >
                    Quick Order by SKU
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    handleResetFilters();
                    setFilters((prev) => ({ ...prev, category: 'medical-equipment' }));
                  }}
                >
                  Browse Medical Equipment
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ProductGrid
                products={displayedProducts}
                isLoading={isLoading}
                onSelectProduct={onSelectProduct}
                onQuickView={onQuickView}
              />

              {hasMore && (
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                  >
                    Load More Supplies ({filteredProducts.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 23, 38, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 120,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: 'var(--color-white)',
              height: '100%',
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Filter Supplies</h3>
              <button
                type="button"
                className="action-btn"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Categories */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '10px' }}>Category</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, category: 'all', subcategory: 'all', brand: 'all' })}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: filters.category === 'all' ? 'var(--color-primary-light)' : 'var(--color-white)',
                    fontWeight: filters.category === 'all' ? 700 : 500,
                    color: filters.category === 'all' ? 'var(--color-primary)' : 'var(--color-ink)',
                  }}
                >
                  All Categories ({PRODUCTS.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilters({ ...filters, category: cat.id, subcategory: 'all', brand: 'all' })}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: filters.category === cat.id ? 'var(--color-primary-light)' : 'var(--color-white)',
                      fontWeight: filters.category === cat.id ? 700 : 500,
                      color: filters.category === cat.id ? 'var(--color-primary)' : 'var(--color-ink)',
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability in mobile */}
            <div style={{ marginBottom: '20px' }}>
              <label className="filter-label">
                <span>
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
                  />
                  In Stock Items Only
                </span>
              </label>
            </div>

            {/* Price in mobile */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>
                Max Price: {formatNaira(filters.maxPrice)}
              </div>
              <input
                type="range"
                min="0"
                max="600"
                step="10"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply Filters ({filteredProducts.length} Results)
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
