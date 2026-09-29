import { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { QuickOrderModal } from './components/QuickOrderModal';
import { AccountModal } from './components/AccountModal';
import { Toast } from './components/Toast';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { CheckoutMockModal } from './pages/CheckoutMockModal';
import { PaystackCallbackPage } from './pages/PaystackCallbackPage';
import { AdminPage } from './pages/AdminPage';

import { Product } from './types';
import { PRODUCTS } from './data/products';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'shop' | 'product' | 'cart' | 'about' | 'contact' | 'callback' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path === '/admin') return 'admin';
      if (path === '/checkout/callback' || search.includes('reference=') || search.includes('trxref=')) {
        return 'callback';
      }
    }
    return 'home';
  });
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const { showToast } = useToast();

  // Scroll to top upon page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, selectedProduct]);

  const handleNavigate = (page: string, params: Record<string, any> = {}) => {
    // If navigating away from callback, clean browser query params cleanly
    if (currentPage === 'callback' && typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({}, '', window.location.pathname === '/checkout/callback' ? '/' : window.location.pathname);
    }
    setCurrentPage(page as any);
    setPageParams(params);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product');
  };

  const handleBuyNow = (product: Product) => {
    setSelectedProduct(product);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. Announcement Trust Bar */}
      <AnnouncementBar />

      {/* 2. Main Sticky Header with Mega Menu & Quick Order */}
      <Header
        activePage={currentPage}
        onNavigate={handleNavigate}
        onSelectProduct={handleSelectProduct}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
      />

      {/* Dynamic View Content */}
      <main style={{ flexGrow: 1 }}>
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            initialCategory={pageParams.category || 'all'}
            initialSubcategory={pageParams.subcategory || 'all'}
            initialSearch={pageParams.search || ''}
            initialBadge={pageParams.badge || ''}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigateHome={() => handleNavigate('home')}
            onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
          />
        )}

        {currentPage === 'product' && (
          <ProductDetailPage
            product={selectedProduct}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigateShop={() => handleNavigate('shop')}
            onNavigateHome={() => handleNavigate('home')}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            onNavigateToCheckout={() => setIsCheckoutModalOpen(true)}
            onNavigateToShop={() => handleNavigate('shop')}
            onNavigateHome={() => handleNavigate('home')}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage
            initialTab={pageParams.tab || 'about'}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateShop={() => handleNavigate('shop')}
            onNavigateContact={() => handleNavigate('contact')}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage
            initialReason={pageParams.reason || 'general'}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {currentPage === 'callback' && (
          <PaystackCallbackPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateShop={() => handleNavigate('shop')}
            onNavigateCart={() => handleNavigate('cart')}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateShop={() => handleNavigate('shop')}
          />
        )}
      </main>

      {/* 9. Comprehensive Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Overlays & Modals */}
      <CartDrawer
        onNavigateToCartPage={() => handleNavigate('cart')}
        onNavigateToCheckout={() => setIsCheckoutModalOpen(true)}
        onNavigateToShop={() => handleNavigate('shop')}
      />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onViewFullPage={(p) => handleSelectProduct(p)}
        onBuyNow={handleBuyNow}
      />

      <QuickOrderModal
        isOpen={isQuickOrderOpen}
        onClose={() => setIsQuickOrderOpen(false)}
        onNavigateShop={() => handleNavigate('shop')}
        onNavigateCart={() => handleNavigate('cart')}
        onSelectProduct={handleSelectProduct}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onNavigateToAdmin={() => handleNavigate('admin')}
      />

      <CheckoutMockModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onOrderCompleted={() => {
          showToast('Order Placed Successfully', 'A confirmation email with your order summary has been generated.');
        }}
      />

      <Toast />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
