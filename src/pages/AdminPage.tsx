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
  ArrowLeft,
  MessageSquare,
  PhoneCall,
  Mail,
  Send,
  Clock,
  CheckCircle,
  Building,
  User
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
  fetchAdminInquiries,
  replyInquiryByEmail,
  resolveInquiryByPhone,
  updateInquiryStatus,
  deleteInquiry,
  AdminProduct, 
  AdminOrder,
  AdminInquiry,
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
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'inquiries'>('products');
  
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
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<AdminOrder | null>(null);
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<number>(0);

  // Auth checking state
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => Boolean(localStorage.getItem('evys_auth_token')));

  // Inquiries state
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquiryFilterStatus, setInquiryFilterStatus] = useState<string>('all');
  const [inquirySearch, setInquirySearch] = useState<string>('');
  
  // Inquiry Modals
  const [replyModalInquiry, setReplyModalInquiry] = useState<AdminInquiry | null>(null);
  const [emailSubjectInput, setEmailSubjectInput] = useState<string>('');
  const [emailReplyMessageInput, setEmailReplyMessageInput] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [phoneModalInquiry, setPhoneModalInquiry] = useState<AdminInquiry | null>(null);
  const [phoneNotesInput, setPhoneNotesInput] = useState<string>('');
  const [isResolvingPhone, setIsResolvingPhone] = useState(false);

  const [viewDetailInquiry, setViewDetailInquiry] = useState<AdminInquiry | null>(null);

  // Verify auth token on mount
  useEffect(() => {
    if (token) {
      setIsCheckingAuth(true);
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
        })
        .finally(() => {
          setIsCheckingAuth(false);
        });
    } else {
      setIsCheckingAuth(false);
    }
  }, [token]);

  // Eagerly load all tab counts and categories upon authentication
  useEffect(() => {
    if (token && currentUser) {
      loadProducts();
      loadOrders();
      loadInquiries();
      fetchCategories()
        .then(setCategories)
        .catch(() => {});
    }
  }, [token, currentUser]);

  // Reactive data loader when changing tab or filters
  useEffect(() => {
    if (token && currentUser) {
      if (activeTab === 'products') {
        loadProducts();
      } else if (activeTab === 'orders') {
        loadOrders();
      } else if (activeTab === 'inquiries') {
        loadInquiries();
      }
    }
  }, [
    activeTab,
    orderFilterStatus,
    orderPaymentStatus,
    orderSearch,
    inquiryFilterStatus,
    inquirySearch
  ]);

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
      const res = await fetchAdminOrders(token, {
        status: orderFilterStatus,
        paymentStatus: orderPaymentStatus,
        search: orderSearch,
      });
      setOrders(res.orders);
    } catch (err: any) {
      showToast('Error Loading Orders', err.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadInquiries = async () => {
    if (!token) return;
    setIsLoadingInquiries(true);
    try {
      const res = await fetchAdminInquiries(token, {
        status: inquiryFilterStatus,
        search: inquirySearch,
      });
      setInquiries(res.inquiries);
    } catch (err: any) {
      showToast('Error Loading Inquiries', err.message);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  const handleSendEmailReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !replyModalInquiry || !emailReplyMessageInput.trim()) return;
    setIsSendingReply(true);
    try {
      await replyInquiryByEmail(token, replyModalInquiry.id, {
        subject: emailSubjectInput.trim() || undefined,
        replyMessage: emailReplyMessageInput.trim(),
      });
      showToast('Email Reply Dispatched', `Response sent to ${replyModalInquiry.email}`);
      setReplyModalInquiry(null);
      setEmailReplyMessageInput('');
      setEmailSubjectInput('');
      loadInquiries();
    } catch (err: any) {
      showToast('Failed to Send Reply', err.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleResolveViaPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !phoneModalInquiry || !phoneNotesInput.trim()) return;
    setIsResolvingPhone(true);
    try {
      await resolveInquiryByPhone(token, phoneModalInquiry.id, phoneNotesInput.trim());
      showToast('Inquiry Resolved', 'Marked as resolved via telephone reachout.');
      setPhoneModalInquiry(null);
      setPhoneNotesInput('');
      loadInquiries();
    } catch (err: any) {
      showToast('Update Failed', err.message);
    } finally {
      setIsResolvingPhone(false);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, status: any) => {
    if (!token) return;
    try {
      await updateInquiryStatus(token, inquiryId, status);
      showToast('Status Updated', `Inquiry status changed to ${status}`);
      loadInquiries();
    } catch (err: any) {
      showToast('Update Failed', err.message);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string, name: string) => {
    if (!token) return;
    if (!window.confirm(`Permanently remove inquiry from "${name}"?`)) return;
    try {
      await deleteInquiry(token, inquiryId);
      showToast('Inquiry Deleted', 'Inquiry was removed.');
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
    } catch (err: any) {
      showToast('Delete Failed', err.message);
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

    const trimmedName = newProduct.name?.trim();
    const price = Number(newProduct.priceExVat);

    if (!trimmedName || isNaN(price) || price <= 0) {
      showToast('Validation Error', 'Please specify a valid product name and a price greater than 0.');
      return;
    }

    const cleanSku = (newProduct.sku?.trim()) || `EVS-${Math.floor(10000 + Math.random() * 90000)}`;
    const cleanSlug = (newProduct.slug?.trim() || trimmedName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const payload: CreateProductPayload = {
      name: trimmedName,
      sku: cleanSku,
      slug: cleanSlug,
      categoryId: newProduct.categoryId || (categories[0]?.id || 'medical-equipment'),
      subcategoryId: newProduct.subcategoryId || undefined,
      brand: (newProduct.brand?.trim()) || "Evy's Clinical",
      productType: newProduct.productType?.trim() || undefined,
      priceExVat: price,
      compareAtPriceExVat: newProduct.compareAtPriceExVat && Number(newProduct.compareAtPriceExVat) > 0 ? Number(newProduct.compareAtPriceExVat) : undefined,
      vatRate: 0.20,
      stockCount: Number(newProduct.stockCount) >= 0 ? Number(newProduct.stockCount) : 10,
      leadTime: newProduct.leadTime?.trim() || 'Nationwide Delivery Available',
      shortDescription: newProduct.shortDescription?.trim() || trimmedName,
      description: newProduct.description?.trim() || newProduct.shortDescription?.trim() || trimmedName,
      images: newProduct.images && newProduct.images.length > 0 && newProduct.images[0] ? newProduct.images : ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80'],
      specifications: newProduct.specifications || [],
      features: newProduct.features || [],
      isFeatured: Boolean(newProduct.isFeatured),
    };

    setIsSubmittingProduct(true);
    try {
      await createAdminProduct(token, payload);
      showToast('Product Created', `"${payload.name}" is now live in the catalogue.`);
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
      showToast('Creation Failed', err.message || 'Failed to create product');
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
  // Authentication Verification Splash
  // ----------------------------------------------------
  if (isCheckingAuth) {
    return (
      <div style={{ maxWidth: '480px', margin: '100px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '44px 32px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#eff4ff',
            color: '#012ea2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RefreshCw size={26} className="animate-spin" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Authenticating Admin Session
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Connecting to Evy's Medics secure clinical console...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <div style={{ padding: '10px', backgroundColor: '#eff4ff', borderRadius: '8px', color: '#012ea2' }}>
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
                backgroundColor: '#012ea2',
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
              backgroundColor: '#012ea2',
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
            backgroundColor: activeTab === 'products' ? '#012ea2' : '#f8fafc',
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
            backgroundColor: activeTab === 'orders' ? '#012ea2' : '#f8fafc',
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

        <button
          onClick={() => setActiveTab('inquiries')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'inquiries' ? '#012ea2' : '#f8fafc',
            color: activeTab === 'inquiries' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquare size={18} /> Contact Inquiries ({inquiries.length})
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
                  backgroundColor: '#012ea2',
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
                  backgroundColor: '#012ea2',
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
          {/* Order Filter & Search Toolbar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 auto' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by Order #, Customer, Email, or Phone..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Filter Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Fulfillment:</span>
                <select
                  value={orderFilterStatus}
                  onChange={(e) => setOrderFilterStatus(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Payment:</span>
                <select
                  value={orderPaymentStatus}
                  onChange={(e) => setOrderPaymentStatus(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid (Verified)</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={loadOrders}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} className={isLoadingOrders ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Orders Table */}
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
                No Orders Match Filter Criteria
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: '0.9rem' }}>
                Try resetting your status filters or searching with a different keyword.
              </p>
              {(orderFilterStatus !== 'all' || orderPaymentStatus !== 'all' || orderSearch !== '') && (
                <button
                  onClick={() => {
                    setOrderFilterStatus('all');
                    setOrderPaymentStatus('all');
                    setOrderSearch('');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#012ea2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Order #</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Customer Details</th>
                    <th style={{ padding: '12px 16px' }}>Items</th>
                    <th style={{ padding: '12px 16px' }}>Delivery</th>
                    <th style={{ padding: '12px 16px' }}>Total Amount</th>
                    <th style={{ padding: '12px 16px' }}>Payment</th>
                    <th style={{ padding: '12px 16px' }}>Fulfillment</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                        {ord.orderNumber}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(ord.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{ord.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{ord.customerEmail}</div>
                        {ord.customerPhone && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📞 {ord.customerPhone}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          {ord.itemCount || (ord.items ? ord.items.length : 1)} {ord.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingDeliveryId === ord.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min={0}
                              value={deliveryFeeInput}
                              onChange={(e) => setDeliveryFeeInput(parseFloat(e.target.value) || 0)}
                              style={{ width: '75px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                            <button
                              onClick={() => handleUpdateDeliveryFee(ord.id)}
                              style={{ padding: '4px 8px', backgroundColor: '#012ea2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
                                  color: '#012ea2',
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
                          fontWeight: 700,
                          backgroundColor: ord.paymentStatus === 'paid' ? '#dcfce7' : ord.paymentStatus === 'cancelled' ? '#fee2e2' : '#fef3c7',
                          color: ord.paymentStatus === 'paid' ? '#166534' : ord.paymentStatus === 'cancelled' ? '#991b1b' : '#92400e',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {ord.paymentStatus === 'paid' && <CheckCircle2 size={12} />}
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
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: ord.status === 'confirmed' ? '#f0fdf4' : ord.status === 'cancelled' ? '#fef2f2' : '#ffffff'
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
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedOrderForDetail(ord)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#012ea2',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={14} /> Details
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

      {/* MODAL: ORDER DETAILS FLYOUT */}
      {selectedOrderForDetail && (
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ORDER SPECIFICATION</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {selectedOrderForDetail.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Customer & Payment Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#64748b', marginBottom: '4px' }}>Customer Details</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedOrderForDetail.customerName}</div>
                <div style={{ color: '#334155' }}>{selectedOrderForDetail.customerEmail}</div>
                {selectedOrderForDetail.customerPhone && (
                  <div style={{ color: '#475569' }}>📞 {selectedOrderForDetail.customerPhone}</div>
                )}
                {selectedOrderForDetail.clinicName && (
                  <div style={{ color: '#012ea2', fontWeight: 600, marginTop: '2px' }}>🏥 {selectedOrderForDetail.clinicName}</div>
                )}
              </div>

              <div>
                <div style={{ color: '#64748b', marginBottom: '4px' }}>Shipping Address</div>
                <div style={{ color: '#1e293b', lineHeight: 1.4 }}>
                  {selectedOrderForDetail.shippingAddress || `${selectedOrderForDetail.shippingAddressLine1 || ''}, ${selectedOrderForDetail.shippingCity || ''} (${selectedOrderForDetail.shippingPostcode || ''})`}
                </div>
                {selectedOrderForDetail.paystackReference && (
                  <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                    Paystack Ref: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedOrderForDetail.paystackReference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>Ordered Items</h4>
              {selectedOrderForDetail.items && selectedOrderForDetail.items.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Product</th>
                      <th style={{ padding: '8px 10px' }}>SKU</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderForDetail.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontWeight: 600, color: '#0f172a' }}>{item.productName}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: '#64748b' }}>{item.sku}</td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#334155' }}>{item.quantity}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>{formatNaira(item.unitPrice)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatNaira(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                  Standard Clinical Order Line Item Allocation
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748b' }}>
                <span>Items Subtotal:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{formatNaira(selectedOrderForDetail.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>Delivery Fee:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{formatNaira(selectedOrderForDetail.deliveryFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', fontSize: '1.05rem', fontWeight: 800 }}>
                <span style={{ color: '#0f172a' }}>Total Amount:</span>
                <span style={{ color: '#012ea2' }}>{formatNaira(selectedOrderForDetail.totalAmount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#012ea2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTACT INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div>
          {/* Inquiry Filter & Search Toolbar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 auto' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by Name, Email, Phone, Organisation, or Message..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Filter Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Inquiry Status:</span>
                <select
                  value={inquiryFilterStatus}
                  onChange={(e) => setInquiryFilterStatus(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="all">All Inquiries</option>
                  <option value="pending">Pending / Unresolved</option>
                  <option value="replied_email">Replied via Email</option>
                  <option value="resolved_phone">Resolved via Phone</option>
                  <option value="closed">Closed / Archived</option>
                </select>
              </div>

              <button
                onClick={loadInquiries}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} className={isLoadingInquiries ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Inquiries Table */}
          {isLoadingInquiries ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <p>Loading customer inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '60px 20px',
              borderRadius: '10px',
              border: '1px dashed #cbd5e1',
              textAlign: 'center'
            }}>
              <MessageSquare size={48} style={{ color: '#94a3b8', margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 8px 0' }}>
                No Inquiries Found
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: '0.9rem' }}>
                Customer submissions from the Contact & Procurement page will appear here.
              </p>
              {(inquiryFilterStatus !== 'all' || inquirySearch !== '') && (
                <button
                  onClick={() => {
                    setInquiryFilterStatus('all');
                    setInquirySearch('');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#012ea2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Customer / Organisation</th>
                    <th style={{ padding: '12px 16px' }}>Subject</th>
                    <th style={{ padding: '12px 16px' }}>Message Preview</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => (
                    <tr key={inq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(inq.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{inq.fullName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          <a href={`mailto:${inq.email}`} style={{ color: '#012ea2', textDecoration: 'none' }}>{inq.email}</a>
                        </div>
                        {inq.phone && (
                          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                            <a href={`tel:${inq.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>📞 {inq.phone}</a>
                          </div>
                        )}
                        {inq.organisation && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            🏥 {inq.organisation}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'capitalize'
                        }}>
                          {inq.enquiryType.replace('-', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155', maxWidth: '280px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.4
                        }}>
                          {inq.message}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {inq.status === 'pending' && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {inq.status === 'replied_email' && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Mail size={12} /> Email Sent
                          </span>
                        )}
                        {inq.status === 'resolved_phone' && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <PhoneCall size={12} /> Resolved (Phone)
                          </span>
                        )}
                        {inq.status === 'closed' && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle size={12} /> Closed
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setReplyModalInquiry(inq);
                              setEmailSubjectInput(`Re: Evy's Medics Store Inquiry — ${inq.enquiryType.replace('-', ' ')}`);
                              setEmailReplyMessageInput(`Dear ${inq.fullName},\n\nThank you for reaching out to Evy's Medics Store regarding your inquiry.\n\n`);
                            }}
                            title="Reply via Email"
                            style={{
                              padding: '5px 9px',
                              backgroundColor: '#012ea2',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Mail size={13} /> Email
                          </button>

                          <button
                            onClick={() => {
                              setPhoneModalInquiry(inq);
                              setPhoneNotesInput(inq.resolvedNotes || '');
                            }}
                            title="Resolve via Phone"
                            style={{
                              padding: '5px 9px',
                              backgroundColor: '#f0fdf4',
                              color: '#166534',
                              border: '1px solid #bbf7d0',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <PhoneCall size={13} /> Phone
                          </button>

                          <button
                            onClick={() => setViewDetailInquiry(inq)}
                            title="View Details"
                            style={{
                              padding: '5px 8px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => handleDeleteInquiry(inq.id, inq.fullName)}
                            title="Delete Inquiry"
                            style={{
                              padding: '5px 7px',
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: EMAIL REPLY */}
      {replyModalInquiry && (
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
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>DIRECT EMAIL DISPATCH</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                  Reply to {replyModalInquiry.fullName}
                </h2>
                <div style={{ fontSize: '0.825rem', color: '#012ea2', fontWeight: 600 }}>
                  Recipient: {replyModalInquiry.email}
                </div>
              </div>
              <button
                onClick={() => setReplyModalInquiry(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Original Inquiry Quote Box */}
            <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #012ea2', padding: '12px 14px', borderRadius: '0 6px 6px 0', marginBottom: '18px', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Customer Inquiry ({replyModalInquiry.enquiryType.replace('-', ' ')})
              </div>
              <div style={{ color: '#334155', fontStyle: 'italic', lineHeight: 1.4 }}>
                "{replyModalInquiry.message}"
              </div>
            </div>

            <form onSubmit={handleSendEmailReply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubjectInput}
                  onChange={(e) => setEmailSubjectInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Response Message *
                </label>
                <textarea
                  rows={6}
                  value={emailReplyMessageInput}
                  onChange={(e) => setEmailReplyMessageInput(e.target.value)}
                  required
                  placeholder="Type your official response to the customer here..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setReplyModalInquiry(null)}
                  disabled={isSendingReply}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: '#012ea2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: isSendingReply ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSendingReply ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  {isSendingReply ? 'Dispatching Email...' : 'Send Email via Brevo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE VIA PHONE */}
      {phoneModalInquiry && (
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
            maxWidth: '540px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#166534' }}>
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Resolve via Telephone Call
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Customer: <strong>{phoneModalInquiry.fullName}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPhoneModalInquiry(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Telephone Call Action Box */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Phone Number</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532d', fontFamily: 'monospace' }}>
                  {phoneModalInquiry.phone || 'No phone number provided'}
                </div>
              </div>
              {phoneModalInquiry.phone && (
                <a
                  href={`tel:${phoneModalInquiry.phone}`}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#166534',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PhoneCall size={14} /> Call Now
                </a>
              )}
            </div>

            <form onSubmit={handleResolveViaPhone} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Resolution Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Spoke with Dr. Eleanor Vance, confirmed bulk quote for 50 surgical kits, sent invoice to clinic."
                  value={phoneNotesInput}
                  onChange={(e) => setPhoneNotesInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPhoneModalInquiry(null)}
                  disabled={isResolvingPhone}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolvingPhone}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#166534',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: isResolvingPhone ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isResolvingPhone ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {isResolvingPhone ? 'Saving...' : 'Mark Resolved via Phone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW INQUIRY DETAILS */}
      {viewDetailInquiry && (
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>INQUIRY RECORD</div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                  {viewDetailInquiry.fullName}
                </h2>
              </div>
              <button
                onClick={() => setViewDetailInquiry(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Information Grid */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#64748b' }}>Email Address</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewDetailInquiry.email}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Phone Number</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewDetailInquiry.phone || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Organisation</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewDetailInquiry.organisation || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Department</div>
                <div style={{ fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{viewDetailInquiry.enquiryType.replace('-', ' ')}</div>
              </div>
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Original Message</div>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {viewDetailInquiry.message}
              </div>
            </div>

            {/* Email Reply or Phone Notes */}
            {viewDetailInquiry.adminReply && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> Email Response Sent
                </div>
                <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '14px', fontSize: '0.875rem', color: '#0c4a6e', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {viewDetailInquiry.adminReply}
                </div>
              </div>
            )}

            {viewDetailInquiry.resolvedNotes && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall size={14} /> Telephone Resolution Notes
                </div>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', fontSize: '0.875rem', color: '#14532d', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {viewDetailInquiry.resolvedNotes}
                </div>
              </div>
            )}

            {/* Status Control */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Change Status:</span>
                <select
                  value={viewDetailInquiry.status}
                  onChange={(e) => {
                    handleUpdateInquiryStatus(viewDetailInquiry.id, e.target.value);
                    setViewDetailInquiry({ ...viewDetailInquiry, status: e.target.value as any });
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="replied_email">Replied via Email</option>
                  <option value="resolved_phone">Resolved via Phone</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <button
                onClick={() => setViewDetailInquiry(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#012ea2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
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
                <div style={{ padding: '8px', backgroundColor: '#eff4ff', borderRadius: '8px', color: '#012ea2' }}>
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
                    backgroundColor: '#012ea2',
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
