import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Package, 
  ShoppingBag, 
  Trash2, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  ShieldCheck, 
  DollarSign, 
  Truck, 
  Layers, 
  CheckCircle2, 
  X,
  Eye,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { 
  fetchAdminProducts, 
  createAdminProduct, 
  updateAdminStock, 
  updateAdminPrice, 
  deleteAdminProduct, 
  purgeAllProducts,
  fetchAdminOrders, 
  updateAdminOrderDelivery, 
  updateAdminOrderStatus, 
  AdminProduct, 
  AdminOrder,
  CreateProductPayload,
  loginUser,
  fetchCurrentUser,
  fetchCategories
} from '../api/client';
import { Category } from '../types';
import { formatNaira } from '../utils/money';
import { useToast } from '../context/ToastContext';

interface AdminPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateHome, onNavigateShop }) => {
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('evys_auth_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  
  // Login state (if not authenticated)
  const [loginEmail, setLoginEmail] = useState('admin@evysmedics.co.uk');
  const [loginPassword, setLoginPassword] = useState('EvysAdminPass2026!');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // New Product Form state
  const [newProduct, setNewProduct] = useState<CreateProductPayload>({
    name: '',
    sku: '',
    slug: '',
    categoryId: 'medical-equipment',
    subcategoryId: '',
    brand: "Evy's Clinical",
    productType: 'Medical Device',
    priceExVat: 0,
    compareAtPriceExVat: 0,
    vatRate: 0.20,
    stockCount: 10,
    leadTime: 'Nationwide Delivery Available',
    shortDescription: '',
    description: '',
    images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { name: 'Model / Type', value: 'Clinical Grade' },
      { name: 'Warranty', value: '12 Months Manufacturer Warranty' }
    ],
    features: ['Precision manufactured for professional healthcare facilities.'],
    isFeatured: false,
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<number>(0);

  // Verify auth token on mount
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token)
        .then((res) => {
          if (res.user.role === 'ADMIN') {
            setCurrentUser(res.user);
          } else {
            setAuthError('Access Denied: You must be an Administrator.');
            setToken(null);
            localStorage.removeItem('evys_auth_token');
          }
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('evys_auth_token');
        });
    }
  }, [token]);

  // Load products and categories when authenticated
  useEffect(() => {
    if (token && currentUser) {
      loadProducts();
      loadOrders();
      fetchCategories()
        .then(setCategories)
        .catch(() => {});
    }
  }, [token, currentUser]);

  const loadProducts = async () => {
    if (!token) return;
    setIsLoadingProducts(true);
    try {
      const res = await fetchAdminProducts(token);
      setProducts(res.products);
    } catch (err: any) {
      showToast('Error Loading Products', err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadOrders = async () => {
    if (!token) return;
    setIsLoadingOrders(true);
    try {
      const statusParam = orderFilterStatus === 'all' ? undefined : orderFilterStatus;
      const res = await fetchAdminOrders(token, statusParam);
      setOrders(res.orders);
    } catch (err: any) {
      showToast('Error Loading Orders', err.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await loginUser(loginEmail, loginPassword);
      if (res.user.role !== 'ADMIN') {
        throw new Error('Access denied: Administrator privileges required.');
      }
      localStorage.setItem('evys_auth_token', res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      showToast('Welcome, Administrator', `Logged in as ${res.user.email}`);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('evys_auth_token');
    setToken(null);
    setCurrentUser(null);
    showToast('Logged Out', 'Admin session terminated.');
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const sku = `EVS-${Math.floor(10000 + Math.random() * 90000)}`;
    setNewProduct(prev => ({ ...prev, name, slug, sku: prev.sku || sku }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newProduct.name || !newProduct.sku || newProduct.priceExVat <= 0) {
      showToast('Validation Error', 'Please specify a valid product name, SKU, and price.');
      return;
    }
    setIsSubmittingProduct(true);
    try {
      await createAdminProduct(token, newProduct);
      showToast('Product Created', `"${newProduct.name}" is now live in the catalogue.`);
      setIsAddModalOpen(false);
      // Reset form
      setNewProduct({
        name: '',
        sku: '',
        slug: '',
        categoryId: categories[0]?.id || 'medical-equipment',
        subcategoryId: '',
        brand: "Evy's Clinical",
        productType: 'Medical Device',
        priceExVat: 0,
        compareAtPriceExVat: 0,
        vatRate: 0.20,
        stockCount: 10,
        leadTime: 'Nationwide Delivery Available',
        shortDescription: '',
        description: '',
        images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80'],
        specifications: [
          { name: 'Model / Type', value: 'Clinical Grade' },
          { name: 'Warranty', value: '12 Months Manufacturer Warranty' }
        ],
        features: ['Precision manufactured for professional healthcare facilities.'],
        isFeatured: false,
      });
      loadProducts();
    } catch (err: any) {
      showToast('Creation Failed', err.message);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (!token || newStock < 0) return;
    try {
      await updateAdminStock(token, productId, newStock);
      showToast('Stock Updated', `Stock updated to ${newStock} units.`);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stockCount: newStock } : p));
    } catch (err: any) {
      showToast('Update Failed', err.message);
    }
  };

  const handleUpdatePrice = async (productId: string, newPrice: number) => {
    if (!token || newPrice <= 0) return;
    try {
      await updateAdminPrice(token, productId, newPrice);
      showToast('Price Updated', `Price updated to ${formatNaira(newPrice)}.`);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, priceExVat: newPrice } : p));
    } catch (err: any) {
      showToast('Update Failed', err.message);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!token) return;
    if (!window.confirm(`Permanently remove "${name}" from the catalogue?`)) return;
    try {
      await deleteAdminProduct(token, productId, true);
      showToast('Product Removed', `"${name}" was deleted from the catalogue.`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err: any) {
      showToast('Delete Failed', err.message);
    }
  };

  const handlePurgeCatalogue = async () => {
    if (!token) return;
    setIsPurging(true);
    try {
      const res = await purgeAllProducts(token);
      showToast('Catalogue Cleared', res.message);
      setIsPurgeModalOpen(false);
      loadProducts();
    } catch (err: any) {
      showToast('Purge Failed', err.message);
    } finally {
      setIsPurging(false);
    }
  };

  const handleUpdateDeliveryFee = async (orderId: string) => {
    if (!token) return;
    try {
      await updateAdminOrderDelivery(token, orderId, deliveryFeeInput);
      showToast('Delivery Fee Updated', `Delivery fee set to ${formatNaira(deliveryFeeInput)}.`);
      setEditingDeliveryId(null);
      loadOrders();
    } catch (err: any) {
      showToast('Update Failed', err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!token) return;
    try {
      await updateAdminOrderStatus(token, orderId, status);
      showToast('Status Updated', `Order status changed to ${status.toUpperCase()}.`);
      loadOrders();
    } catch (err: any) {
      showToast('Update Failed', err.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ----------------------------------------------------
  // Unauthenticated Admin Gate
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '32px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '10px', backgroundColor: '#e6fffa', borderRadius: '8px', color: '#0d9488' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Evy’s Admin Portal
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Secure management console for catalogue & orders
              </p>
            </div>
          </div>

          {authError && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.875rem',
              color: '#991b1b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Admin Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoggingIn ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {isLoggingIn ? 'Verifying Access...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={onNavigateHome}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={16} /> Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Authenticated Admin Portal UI
  // ----------------------------------------------------
  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '32px 20px 80px 20px' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#0d9488',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              ADMIN
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Evy’s Management Console
            </h1>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Logged in as <strong>{currentUser.email}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onNavigateShop}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={16} /> View Storefront
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'products' ? '#0d9488' : '#f8fafc',
            color: activeTab === 'products' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Package size={18} /> Products Catalogue ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'orders' ? '#0d9488' : '#f8fafc',
            color: activeTab === 'orders' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShoppingBag size={18} /> Customer Orders ({orders.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS CATALOGUE */}
      {activeTab === 'products' && (
        <div>
          {/* Action Toolbar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 auto' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search products by SKU, name, or brand..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsPurgeModalOpen(true)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#fff1f2',
                  color: '#e11d48',
                  border: '1px solid #fecdd3',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={16} /> Clear Sample Products
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={18} /> Add New Product
              </button>
            </div>
          </div>

          {/* Products Table */}
          {isLoadingProducts ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <p>Loading catalogue products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '60px 20px',
              borderRadius: '10px',
              border: '1px dashed #cbd5e1',
              textAlign: 'center'
            }}>
              <Package size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 8px 0' }}>
                No Products in Catalogue
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 20px 0', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                The catalogue is currently empty. Click the button below to add your genuine medical products.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={18} /> Add Your First Product
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Product</th>
                    <th style={{ padding: '12px 16px' }}>SKU</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Price (₦)</th>
                    <th style={{ padding: '12px 16px' }}>Stock</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={prod.imageUrl || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=100&q=80'}
                            alt={prod.name}
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#f1f5f9' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{prod.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#334155' }}>
                        {prod.sku}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {prod.categoryName || prod.category}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="number"
                          defaultValue={prod.priceExVat}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== prod.priceExVat) {
                              handleUpdatePrice(prod.id, val);
                            }
                          }}
                          style={{
                            width: '100px',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="number"
                          defaultValue={prod.stockCount}
                          min={0}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== prod.stockCount) {
                              handleUpdateStock(prod.id, val);
                            }
                          }}
                          style={{
                            width: '70px',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: prod.stockCount > 0 ? '#dcfce7' : '#fee2e2',
                          color: prod.stockCount > 0 ? '#166534' : '#991b1b'
                        }}>
                          {prod.stockCount > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          title="Delete Product"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#fff1f2',
                            color: '#e11d48',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER ORDERS */}
      {activeTab === 'orders' && (
        <div>
          {/* Order Filter Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Filter by Status:</span>
              <select
                value={orderFilterStatus}
                onChange={(e) => setOrderFilterStatus(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem'
                }}
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={loadOrders}
              style={{
                padding: '6px 14px',
                backgroundColor: '#f8fafc',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} /> Refresh Orders
            </button>
          </div>

          {isLoadingOrders ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <p>Loading customer orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '60px 20px',
              borderRadius: '10px',
              border: '1px dashed #cbd5e1',
              textAlign: 'center'
            }}>
              <ShoppingBag size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 8px 0' }}>
                No Orders Found
              </h3>
              <p style={{ color: '#64748b', margin: 0 }}>
                Orders placed through the customer storefront will appear here.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Order #</th>
                    <th style={{ padding: '12px 16px' }}>Customer</th>
                    <th style={{ padding: '12px 16px' }}>Subtotal</th>
                    <th style={{ padding: '12px 16px' }}>Delivery Fee</th>
                    <th style={{ padding: '12px 16px' }}>Total Amount</th>
                    <th style={{ padding: '12px 16px' }}>Payment</th>
                    <th style={{ padding: '12px 16px' }}>Order Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {ord.orderNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{ord.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ord.customerEmail}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {formatNaira(ord.subtotal)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingDeliveryId === ord.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min={0}
                              value={deliveryFeeInput}
                              onChange={(e) => setDeliveryFeeInput(parseFloat(e.target.value) || 0)}
                              style={{ width: '80px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                            <button
                              onClick={() => handleUpdateDeliveryFee(ord.id)}
                              style={{ padding: '4px 8px', backgroundColor: '#0d9488', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingDeliveryId(null)}
                              style={{ padding: '4px 6px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{formatNaira(ord.deliveryFee)}</span>
                            {ord.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => {
                                  setEditingDeliveryId(ord.id);
                                  setDeliveryFeeInput(ord.deliveryFee);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#0d9488',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {formatNaira(ord.totalAmount)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: ord.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                          color: ord.paymentStatus === 'paid' ? '#166534' : '#92400e'
                        }}>
                          {ord.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD NEW PRODUCT */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', backgroundColor: '#e6fffa', borderRadius: '8px', color: '#0d9488' }}>
                  <Plus size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Add New Medical Product
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Publish a genuine product directly to the storefront catalogue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Product Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mindray BeneHeart C1A Semi-Automatic Defibrillator"
                  value={newProduct.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              {/* SKU & Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    SKU / Reference Code *
                  </label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Category & Product Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {categories.length === 0 && (
                      <>
                        <option value="medical-equipment">Medical Equipment</option>
                        <option value="laboratory-diagnostics">Laboratory & Diagnostics</option>
                        <option value="surgical-instruments">Surgical Instruments</option>
                        <option value="consumables-disposables">Consumables & Disposables</option>
                        <option value="healthcare-apparel">Healthcare Apparel</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Product Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diagnostic Device"
                    value={newProduct.productType}
                    onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Price in ₦ (NGN) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newProduct.priceExVat}
                    onChange={(e) => setNewProduct({ ...newProduct, priceExVat: parseFloat(e.target.value) || 0 })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Initial Stock Count *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newProduct.stockCount}
                    onChange={(e) => setNewProduct({ ...newProduct, stockCount: parseInt(e.target.value, 10) || 0 })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Product Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProduct.images?.[0] || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, images: [e.target.value] })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              {/* Short Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Product Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Clinical overview and technical details of the product..."
                  value={newProduct.shortDescription}
                  onChange={(e) => setNewProduct({ ...newProduct, shortDescription: e.target.value, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: isSubmittingProduct ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmittingProduct ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSubmittingProduct ? 'Publishing Product...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PURGE ALL SAMPLE PRODUCTS */}
      {isPurgeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Clear All Sample Products?
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              This will permanently delete all <strong>{products.length} sample products</strong> currently in the database so you can populate the store with your genuine client catalogue. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isPurging}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeCatalogue}
                disabled={isPurging}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: isPurging ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isPurging ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {isPurging ? 'Purging Catalogue...' : 'Yes, Purge All Products'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
