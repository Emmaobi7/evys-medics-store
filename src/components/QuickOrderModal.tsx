import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Zap, Check, Plus, AlertCircle, ShoppingBag, ArrowRight, Trash2, ArrowLeft, Layers } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { QuantitySelector } from './QuantitySelector';
import { Button } from './Button';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateShop?: () => void;
  onNavigateCart?: () => void;
  onSelectProduct?: (product: Product) => void;
}

interface MultiOrderRow {
  id: string;
  skuInput: string;
  product: Product | null;
  quantity: number;
  isInvalid?: boolean;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  onNavigateShop,
  onNavigateCart,
  onSelectProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');
  
  // Single SKU state
  const [singleSku, setSingleSku] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [isSearched, setIsSearched] = useState(false);
  const [isInvalidSku, setIsInvalidSku] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<{ product: Product; quantity: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Multi SKU state
  const [multiRows, setMultiRows] = useState<MultiOrderRow[]>([
    { id: '1', skuInput: '', product: null, quantity: 1 },
    { id: '2', skuInput: '', product: null, quantity: 1 },
    { id: '3', skuInput: '', product: null, quantity: 1 },
  ]);

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const singleInputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => singleInputRef.current?.focus(), 50);
    }
  }, [isOpen, activeTab]);

  // Matching SKU suggestions for single mode
  const matchingSuggestions = useMemo(() => {
    if (!singleSku.trim() || selectedProduct) return [];
    const q = singleSku.toLowerCase().trim();
    return PRODUCTS.filter(
      (p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [singleSku, selectedProduct]);

  if (!isOpen) return null;

  // Single SKU lookup logic
  const handleFindProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleSku.trim()) return;

    const trimmed = singleSku.trim().toLowerCase();
    const found = PRODUCTS.find(
      (p) => p.sku.toLowerCase() === trimmed || p.name.toLowerCase() === trimmed
    );

    setIsSearched(true);
    setShowSuggestions(false);

    if (found) {
      setSelectedProduct(found);
      setIsInvalidSku(false);
    } else {
      setSelectedProduct(null);
      setIsInvalidSku(true);
    }
  };

  const handleSelectSuggestedProduct = (product: Product) => {
    setSelectedProduct(product);
    setSingleSku(product.sku);
    setIsSearched(true);
    setIsInvalidSku(false);
    setShowSuggestions(false);
  };

  const handleAddSingleToBasket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    addToCart(selectedProduct, singleQuantity);
    setLastAddedProduct({ product: selectedProduct, quantity: singleQuantity });
    showToast(
      'Quick Order Added',
      `${singleQuantity}x ${selectedProduct.name} (${selectedProduct.sku}) added to your basket.`
    );
  };

  const handleResetSingle = () => {
    setSingleSku('');
    setSelectedProduct(null);
    setSingleQuantity(1);
    setIsSearched(false);
    setIsInvalidSku(false);
    setLastAddedProduct(null);
    setShowSuggestions(false);
    setTimeout(() => singleInputRef.current?.focus(), 50);
  };

  // Multi-row SKU lookup handlers
  const handleMultiSkuChange = (rowId: string, value: string) => {
    const trimmed = value.trim().toLowerCase();
    const found = PRODUCTS.find((p) => p.sku.toLowerCase() === trimmed);

    setMultiRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            skuInput: value,
            product: found || null,
            isInvalid: Boolean(value.trim() && !found),
          };
        }
        return row;
      })
    );
  };

  const handleMultiQuantityChange = (rowId: string, qty: number) => {
    setMultiRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, quantity: Math.max(1, qty) } : row))
    );
  };

  const handleAddRow = () => {
    const nextId = String(Date.now());
    setMultiRows((prev) => [...prev, { id: nextId, skuInput: '', product: null, quantity: 1 }]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (multiRows.length > 1) {
      setMultiRows((prev) => prev.filter((r) => r.id !== rowId));
    } else {
      setMultiRows([{ id: '1', skuInput: '', product: null, quantity: 1 }]);
    }
  };

  const validMultiItems = multiRows.filter((r): r is MultiOrderRow & { product: Product } => Boolean(r.product));
  const multiSubtotalExVat = validMultiItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleAddAllMultiToBasket = () => {
    if (validMultiItems.length === 0) return;

    validMultiItems.forEach((item) => {
      addToCart(item.product, item.quantity);
    });

    showToast(
      'Bulk Quick Order Added',
      `${validMultiItems.length} product line(s) successfully added to basket.`
    );

    // Reset rows and navigate or close
    setMultiRows([
      { id: '1', skuInput: '', product: null, quantity: 1 },
      { id: '2', skuInput: '', product: null, quantity: 1 },
      { id: '3', skuInput: '', product: null, quantity: 1 },
    ]);
    onClose();
    if (onNavigateCart) {
      onNavigateCart();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 23, 38, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: activeTab === 'multi' ? '740px' : '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          padding: '28px',
          boxSizing: 'border-box',
          transition: 'max-width 200ms ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="action-btn"
          onClick={onClose}
          aria-label="Close Quick Order modal"
          style={{ position: 'absolute', top: '16px', right: '16px' }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingRight: '40px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)' }}>Quick Order</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
              Already know what you need? Enter product SKU codes to add directly to your basket.
            </p>
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            margin: '18px 0 20px 0',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '12px',
          }}
        >
          <button
            type="button"
            className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('single');
              handleResetSingle();
            }}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
          >
            Single SKU Lookup
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'multi' ? 'active' : ''}`}
            onClick={() => setActiveTab('multi')}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
          >
            Multi-Item Order (Bulk)
          </button>
        </div>

        {/* TAB 1: SINGLE SKU FAST ORDER */}
        {activeTab === 'single' && (
          <div>
            {lastAddedProduct ? (
              /* Confirmation Success State */
              <div
                style={{
                  padding: '24px 20px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <Check size={24} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '4px' }}>
                  Added to Basket
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '20px' }}>
                  <strong>{lastAddedProduct.quantity}x {lastAddedProduct.product.name}</strong> ({lastAddedProduct.product.sku}) is in your basket.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    onClick={handleResetSingle}
                  >
                    Continue Quick Order
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<ShoppingBag size={16} />}
                    onClick={() => {
                      onClose();
                      if (onNavigateCart) onNavigateCart();
                    }}
                  >
                    View Basket
                  </Button>
                </div>
              </div>
            ) : (
              /* Single SKU Search & Configure Form */
              <form onSubmit={selectedProduct ? handleAddSingleToBasket : handleFindProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Enter Product SKU
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                      <Search
                        size={16}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}
                      />
                      <input
                        ref={singleInputRef}
                        type="text"
                        placeholder="e.g. MED-10482, LAB-20941, CON-30128..."
                        value={singleSku}
                        onChange={(e) => {
                          setSingleSku(e.target.value);
                          setShowSuggestions(true);
                          if (selectedProduct || isInvalidSku) {
                            setSelectedProduct(null);
                            setIsInvalidSku(false);
                            setIsSearched(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !selectedProduct) {
                            e.preventDefault();
                            handleFindProduct();
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 38px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isInvalidSku ? 'var(--color-danger)' : 'var(--color-border)'}`,
                          fontSize: '0.9375rem',
                          fontFamily: 'var(--font-mono)',
                          textTransform: 'uppercase',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <Button
                      variant="secondary"
                      size="md"
                      type="button"
                      onClick={() => handleFindProduct()}
                    >
                      Find Product
                    </Button>
                  </div>

                  {/* Suggestions Popover while typing */}
                  {showSuggestions && matchingSuggestions.length > 0 && !selectedProduct && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        marginTop: '4px',
                        zIndex: 20,
                        maxHeight: '220px',
                        overflowY: 'auto',
                      }}
                    >
                      {matchingSuggestions.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectSuggestedProduct(p)}
                          style={{
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--color-border)',
                            fontSize: '0.8125rem',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
                              {p.sku}
                            </span>
                            <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{p.name}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>£{p.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Valid SKU: Product Identified Card */}
                {selectedProduct && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        style={{
                          width: '56px',
                          height: '56px',
                          objectFit: 'contain',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-white)',
                          border: '1px solid var(--color-border)',
                          padding: '4px',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 700 }}>
                            {selectedProduct.sku}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>• {selectedProduct.categoryName}</span>
                        </div>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px', lineHeight: 1.3 }}>
                          {selectedProduct.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.8125rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-ink)' }}>
                            £{selectedProduct.price.toFixed(2)} <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--color-muted)' }}>ex. VAT</span>
                          </span>
                          <span style={{ color: 'var(--color-muted)' }}>•</span>
                          <span style={{ color: selectedProduct.inStock ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                            {selectedProduct.inStock ? `In Stock (${selectedProduct.stockCount} available)` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector and Line Total */}
                    <div className="quickorder-actions-row">
                      <div className="pdp-qty-group">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                          Quantity
                        </span>
                        <QuantitySelector
                          quantity={singleQuantity}
                          onIncrease={() => setSingleQuantity((q) => Math.min(selectedProduct.stockCount, q + 1))}
                          onDecrease={() => setSingleQuantity((q) => Math.max(1, q - 1))}
                          max={selectedProduct.stockCount}
                        />
                      </div>

                      <div style={{ flexGrow: 1 }}>
                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth
                          type="submit"
                          icon={<ShoppingBag size={18} />}
                        >
                          Add to Basket • £{(selectedProduct.price * singleQuantity).toFixed(2)} ex. VAT
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invalid SKU State */}
                {isInvalidSku && (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#FEF3F2',
                      border: '1px solid #FECDCA',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <AlertCircle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#B42318' }}>
                        SKU not found
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#912018', marginTop: '2px', marginBottom: '10px', lineHeight: 1.45 }}>
                        We couldn't find a product matching "{singleSku}". Check the code and try again, or browse the catalogue.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={handleResetSingle}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Try Again
                        </button>
                        {onNavigateShop && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-teal"
                            onClick={() => {
                              onClose();
                              onNavigateShop();
                            }}
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          >
                            Browse Catalogue
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Neutral Tip when clean */}
                {!selectedProduct && !isInvalidSku && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      backgroundColor: 'var(--color-bg)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>Popular sample SKUs: <strong>MED-10482</strong>, <strong>LAB-20941</strong>, <strong>CON-30128</strong>, <strong>APP-40192</strong></span>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MULTI-ITEM BULK SKU ORDER */}
        {activeTab === 'multi' && (
          <div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '14px' }}>
              Add multiple items by SKU in a single pass. Quantities and availability calculate automatically.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {multiRows.map((row, index) => (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr 100px 90px 32px',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 10px',
                    backgroundColor: row.product ? 'var(--color-bg)' : '#FFFFFF',
                    border: `1px solid ${row.isInvalid ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                  }}
                  className="multi-sku-row"
                >
                  {/* SKU Input */}
                  <input
                    type="text"
                    placeholder={`SKU #${index + 1}`}
                    value={row.skuInput}
                    onChange={(e) => handleMultiSkuChange(row.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.8125rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Product Identification / Status */}
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    {row.product ? (
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.product.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)', fontWeight: 600 }}>
                          ✓ In stock • £{row.product.price.toFixed(2)} ex. VAT
                        </div>
                      </div>
                    ) : row.isInvalid ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                        SKU not recognized
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted-light)' }}>
                        Enter valid SKU code
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div>
                    <input
                      type="number"
                      min="1"
                      max={row.product ? row.product.stockCount : 99}
                      value={row.quantity}
                      disabled={!row.product}
                      onChange={(e) => handleMultiQuantityChange(row.id, parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        textAlign: 'center',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Line Total */}
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-ink)' }}>
                    {row.product ? `£${(row.product.price * row.quantity).toFixed(2)}` : '—'}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                    }}
                    title="Remove row"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Row Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={handleAddRow}
              >
                Add another item
              </Button>

              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                Identified Lines Subtotal: <span style={{ color: 'var(--color-primary)' }}>£{multiSubtotalExVat.toFixed(2)}</span> ex. VAT
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={validMultiItems.length === 0}
              icon={<ShoppingBag size={18} />}
              onClick={handleAddAllMultiToBasket}
            >
              Add {validMultiItems.length} Item{validMultiItems.length === 1 ? '' : 's'} to Basket ({`£${multiSubtotalExVat.toFixed(2)} ex. VAT`})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
