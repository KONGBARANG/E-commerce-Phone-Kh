import { Link, Route, Routes } from 'react-router-dom';
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/search" element={<ProductsPage search />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-complete/:id" element={<OrderCompletePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage register />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="*" element={<main className="not-found"><span>404</span><h1>រកមិនឃើញទំព័រនេះទេ</h1><Link className="button-primary" to="/">ត្រឡប់ទៅទំព័រដើម</Link></main>} />
    </Routes>
  );
}

export default AppRoutes;
