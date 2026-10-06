import { useCallback, useEffect, useMemo, useState } from 'react';
import { StoreContext } from './StoreContext';
import {
  addCartItem,
  createOrder as submitOrder,
  deleteCartItem,
  fetchAdminOrders,
  fetchAdminSummary,
  fetchAdminUsers,
  fetchCart,
  fetchCurrentUser,
  fetchMyOrders,
  fetchProducts,
  loginAccount,
  logoutAccount,
  registerAccount,
  setCartItemQuantity,
  updateOrderStatus,
} from '../services/api';

export function ShopProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSummary, setAdminSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const refreshProducts = useCallback(async () => {
    const result = await fetchProducts();
    setProducts(result);
    return result;
  }, []);

  const refreshCart = useCallback(async () => {
    const result = await fetchCart();
    setCart(result);
    return result;
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!localStorage.getItem('phonekh-auth-token')) {
      setOrders([]);
      return [];
    }
    const result = await fetchMyOrders();
    setOrders(result);
    return result;
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const results = await Promise.allSettled([fetchProducts(), fetchCart()]);
      if (!active) return;
      if (results[0].status === 'fulfilled') setProducts(results[0].value);
      if (results[0].status === 'rejected') setApiError(results[0].reason.message);
      if (results[1].status === 'fulfilled') setCart(results[1].value);
      if (results[1].status === 'rejected') setApiError(results[1].reason.message);
      if (localStorage.getItem('phonekh-auth-token')) {
        try {
          const profile = await fetchCurrentUser();
          if (!active) return;
          setUser(profile.user);
          setOrders(await fetchMyOrders());
        } catch (error) {
          if (!active) return;
          localStorage.removeItem('phonekh-auth-token');
          setApiError(error.message);
        }
      }
      if (active) setLoading(false);
    };
    initialize().catch((error) => {
      if (active) {
        console.error('Unable to initialize store data:', error);
        setApiError(error.message);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const addToCart = useCallback(async (product, quantity = 1) => {
    try {
      const result = await addCartItem(product._id, quantity);
      setCart(result);
      setApiError('');
      return result;
    } catch (error) {
      setApiError(error.message);
      return null;
    }
  }, []);

  const updateQuantity = useCallback(async (id, quantity) => {
    try {
      const result = await setCartItemQuantity(id, quantity);
      setCart(result);
      setApiError('');
      return result;
    } catch (error) {
      setApiError(error.message);
      return null;
    }
  }, []);

  const removeFromCart = useCallback(async (id) => {
    try {
      const result = await deleteCartItem(id);
      setCart(result);
      setApiError('');
      return result;
    } catch (error) {
      setApiError(error.message);
      return null;
    }
  }, []);

  const authenticate = useCallback(async (action, details) => {
    const authenticatedUser = await action(details);
    setUser(authenticatedUser);
    await Promise.all([refreshCart(), refreshOrders()]);
    return authenticatedUser;
  }, [refreshCart, refreshOrders]);

  const signIn = useCallback((credentials) => authenticate(loginAccount, credentials), [authenticate]);
  const signUp = useCallback((details) => authenticate(registerAccount, details), [authenticate]);

  const signOut = useCallback(async () => {
    try {
      await logoutAccount();
    } catch (error) {
      setApiError(error.message);
    } finally {
      setUser(null);
      setOrders([]);
      localStorage.removeItem('phonekh-cart-token');
      try {
        await refreshCart();
      } catch (error) {
        setApiError(error.message);
      }
    }
  }, [refreshCart]);

  const placeOrder = useCallback(async (details) => {
    const order = await submitOrder(details);
    await Promise.all([refreshCart(), refreshProducts(), refreshOrders()]);
    return order;
  }, [refreshCart, refreshProducts, refreshOrders]);

  const refreshAdmin = useCallback(async () => {
    const [summary, adminOrderList, users] = await Promise.all([
      fetchAdminSummary(),
      fetchAdminOrders(),
      fetchAdminUsers(),
    ]);
    setAdminSummary(summary);
    setOrders(adminOrderList);
    setAdminUsers(users);
    return { summary, orders: adminOrderList, users };
  }, []);

  const setOrderStatus = useCallback(async (id, status) => {
    const order = await updateOrderStatus(id, status);
    setOrders((current) => current.map((entry) => entry._id === order._id ? order : entry));
    return order;
  }, []);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  const value = useMemo(() => ({
    products, setProducts, refreshProducts,
    cart, setCart, addToCart, updateQuantity, removeFromCart, refreshCart, cartCount, cartTotal,
    orders, setOrders, refreshOrders, placeOrder,
    user, setUser, signIn, signUp, signOut,
    adminUsers, adminSummary, refreshAdmin, setOrderStatus,
    loading, apiError, setApiError,
  }), [
    products, refreshProducts, cart, addToCart, updateQuantity, removeFromCart, refreshCart,
    cartCount, cartTotal, orders, refreshOrders, placeOrder, user, signIn, signUp, signOut,
    adminUsers, adminSummary, refreshAdmin, setOrderStatus, loading, apiError,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
