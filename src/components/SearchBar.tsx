import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, X, ArrowRight, Layers, CornerDownLeft } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { fetchSearchSuggestions } from '../api/client';
import { Product } from '../types';

interface SearchBarProps {
  onSelectProduct?: (product: Product) => void;
  onViewAllResults?: (query: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectProduct,
  onViewAllResults,
  onSelectCategory,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [matchingCategories, setMatchingCategories] = useState<Array<{ id: string; name: string; slug: string; isSubcategory: boolean }>>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Live debounced backend search query
  useEffect(() => {
    if (!query.trim()) {
      setMatchingProducts([]);
      setMatchingCategories([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSearchSuggestions(query.trim())
        .then((res) => {
          const mapped = res.products.map((p) => {
            const fallback = PRODUCTS.find((prod) => prod.id === p.id || prod.sku === p.sku);
            return (
              fallback || {
                id: p.id,
                sku: p.sku,
                name: p.name,
                slug: p.slug,
                category: 'medical-equipment' as const,
                categoryName: p.categoryName,
                price: p.price,
                shortDescription: p.shortDescription,
                description: [p.shortDescription],
                features: [],
                specifications: [],
                images: p.imageUrl ? [p.imageUrl] : [],
                inStock: true,
                stockCount: 10,
                leadTime: 'Standard Courier Dispatch',
                brand: 'EVYS Medical',
                rating: 5,
                reviewCount: 1,
              }
            );
          });
          setMatchingProducts(mapped);
          setMatchingCategories(res.categories);
        })
        .catch(() => {
          // Fallback to local filter if API is offline
          const q = query.toLowerCase().trim();
          const localProds = PRODUCTS.filter((p) => {
            const nameMatch = p.name.toLowerCase().includes(q);
            const skuMatch = p.sku.toLowerCase().includes(q);
            const catMatch = p.categoryName.toLowerCase().includes(q);
            const subMatch = p.subcategoryName ? p.subcategoryName.toLowerCase().includes(q) : false;
            const brandMatch = p.brand ? p.brand.toLowerCase().includes(q) : false;
            const descMatch = p.shortDescription ? p.shortDescription.toLowerCase().includes(q) : false;
            return nameMatch || skuMatch || catMatch || subMatch || brandMatch || descMatch;
          }).slice(0, 6);
          setMatchingProducts(localProds);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation & interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      setSelectedIndex((prev) => (prev < matchingProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matchingProducts.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < matchingProducts.length) {
        e.preventDefault();
        onSelectProduct?.(matchingProducts[selectedIndex]);
        setIsOpen(false);
      } else if (query.trim() && onViewAllResults) {
        e.preventDefault();
        onViewAllResults(query.trim());
        setIsOpen(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < matchingProducts.length) {
      onSelectProduct?.(matchingProducts[selectedIndex]);
      setIsOpen(false);
    } else if (query.trim() && onViewAllResults) {
      onViewAllResults(query.trim());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="header-search-box" ref={searchRef} style={{ width: '100%', position: 'relative' }}>
      <form onSubmit={handleFormSubmit} style={{ width: '100%', position: 'relative' }}>
        <Search className="header-search-icon" size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products, SKU..."
          className="header-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen && query.trim() !== ''}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Search medical and laboratory supplies catalogue"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search text"
            title="Clear search"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
            }}
          >
            <X size={14} />
          </button>
        )}
      </form>

      {/* Mature, compact ecommerce search suggestion overlay */}
      {isOpen && query.trim() !== '' && (
        <div
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: '300px',
            maxWidth: 'min(440px, calc(100vw - 32px))',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 110,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Subtle Supplier Header */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: '#FAFBFC',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-muted)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Catalogue Suggestions</span>
            <span style={{ fontSize: '0.6875rem', textTransform: 'none', color: 'var(--color-muted-light)' }}>
              Press ↵ to search
            </span>
          </div>

          {/* Department / Category quick suggestions */}
          {matchingCategories.length > 0 && (
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#FAFBFC' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '6px' }}>
                Categories ({matchingCategories.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {matchingCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(cat.id);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-white)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      color: 'var(--color-ink)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  >
                    <Layers size={12} style={{ color: 'var(--color-primary)' }} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Items */}
          {matchingProducts.length > 0 ? (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <div style={{ padding: '6px 14px 2px 14px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Products ({matchingProducts.length})
              </div>
              {matchingProducts.map((product, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={product.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectProduct?.(product);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '9px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      transition: 'background-color 100ms ease',
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#FAFAFA',
                        border: '1px solid var(--color-border)',
                        padding: '2px',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {product.sku}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-muted)' }}>• {product.categoryName}</span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--color-ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '1px',
                        }}
                      >
                        {product.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                        £{product.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)' }}>ex. VAT</div>
                    </div>
                  </div>
                );
              })}

              {/* View All Results Footer CTA */}
              <div
                onClick={() => {
                  onViewAllResults?.(query.trim());
                  setIsOpen(false);
                }}
                style={{
                  padding: '11px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--color-border)',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              >
                <span>View all catalogue results for "<strong>{query}</strong>"</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                  <CornerDownLeft size={13} />
                  <span>Enter</span>
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }}>
                No quick matches for "{query}"
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '12px' }}>
                Press Enter to view full catalogue search results.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline-teal"
                onClick={() => {
                  onViewAllResults?.(query.trim());
                  setIsOpen(false);
                }}
              >
                Search all supplies
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
