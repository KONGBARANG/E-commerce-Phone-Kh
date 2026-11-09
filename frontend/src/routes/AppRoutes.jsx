import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import AdminPage from '../pages/AdminPage';
import {
  AccountPage,
  CartPage,
  CheckoutPage,
  ContactPage,
  LoginPage,
  OrderCompletePage,
  ProductDetailsPage,
  ProductsPage,
} from '../pages/StorePages';
import { TranslateTree } from '../context/LanguageProvider';
import { useShop } from '../context/useShop';

function RequireUser({ children }) {
  const { user, loading } = useShop();
  const location = useLocation();
  if (loading) return <TranslateTree><main className="empty-state"><p className="loading-note">កំពុងផ្ទៀងផ្ទាត់គណនី...</p></main></TranslateTree>;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage categoryDefault="Smartphone" />} />
      <Route path="/phones" element={<ProductsPage categoryDefault="Smartphone" />} />
      <Route path="/chargers" element={<ProductsPage categoryDefault="Chargers" />} />
      <Route path="/search" element={<ProductsPage search />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="/cart" element={<RequireUser><CartPage /></RequireUser>} />
      <Route path="/checkout" element={<RequireUser><CheckoutPage /></RequireUser>} />
      <Route path="/order-complete/:id" element={<OrderCompletePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage register />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="*" element={<TranslateTree><main className="not-found"><span>404</span><h1>រកមិនឃើញទំព័រនេះទេ</h1><Link className="button-primary" to="/">ត្រឡប់ទៅទំព័រដើម</Link></main></TranslateTree>} />
    </Routes>
  );
}

export default AppRoutes;
