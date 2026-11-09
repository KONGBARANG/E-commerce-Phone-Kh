import { useCallback, useEffect, useMemo, useState } from 'react';
import { StoreContext } from './StoreContext';
import {
  addCartItem,
  cancelMyOrder as submitOrderCancellation,
  confirmMyRefundReceived,
  confirmMyOrderReceived,
  createOrder as submitOrder,
  deleteAdminOrder as removeAdminOrder,
  deleteCartItem,
  fetchAdminOrders,
  fetchAdminContactMessages,
  fetchAdminSummary,
  fetchAdminUsers,
  fetchCart,
  fetchCurrentUser,
  fetchMyOrders,
  fetchProducts,
  markAdminRefundSent,
  markAdminContactMessageRead,
  deleteAdminContactMessage,
  replyToAdminContactMessage,
  updateOrderPaymentStatus,
  updateUserProfile,
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
  const [adminContactMessages, setAdminContactMessages] = useState([]);
  const [adminSummary, setAdminSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const refreshProducts = useCallback(async () => {
    const result = await fetchProducts();
    setProducts(result);
    return result;
  }, []);

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem('phonekh-auth-token')) {
      setCart([]);
      return [];
    }
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
      const productsRequest = fetchProducts();
      let authenticated = false;
      if (localStorage.getItem('phonekh-auth-token')) {
        try {
          const profile = await fetchCurrentUser();
          if (!active) return;
          setUser(profile.user);
          authenticated = true;
        } catch (error) {
          if (!active) return;
          localStorage.removeItem('phonekh-auth-token');
          setApiError(error.message);
        }
      }
      const results = await Promise.allSettled([
        productsRequest,
        ...(authenticated ? [fetchCart(), fetchMyOrders()] : []),
      ]);
      if (!active) return;
      if (results[0].status === 'fulfilled') setProducts(results[0].value);
      if (results[0].status === 'rejected') setApiError(results[0].reason.message);
      if (authenticated) {
        if (results[1].status === 'fulfilled') setCart(results[1].value);
        if (results[1].status === 'rejected') setApiError(results[1].reason.message);
        if (results[2].status === 'fulfilled') setOrders(results[2].value);
        if (results[2].status === 'rejected') setApiError(results[2].reason.message);
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

  const addToCart = useCallback(async (product, quantity = 1, color = '') => {
    if (!localStorage.getItem('phonekh-auth-token')) {
      setApiError('សូមចូលគណនី ឬបង្កើតគណនី ដើម្បីបន្ថែមទំនិញទៅកន្ត្រក។');
      return null;
    }
    try {
      const result = await addCartItem(product._id, quantity, color);
      setCart(result);
      setApiError('');
      return result;
    } catch (error) {
      setApiError(error.message);
      return null;
    }
  }, []);

  const queueCartItem = useCallback((product, quantity = 1, color = '') => {
    sessionStorage.setItem('phonekh-pending-cart-item', JSON.stringify({
      productId: product._id,
      quantity,
      color,
    }));
  }, []);

  const updateQuantity = useCallback(async (item, quantity) => {
    try {
      const result = await setCartItemQuantity(item, quantity);
      setCart(result);
      setApiError('');
      return result;
    } catch (error) {
      setApiError(error.message);
      return null;
    }
  }, []);

  const removeFromCart = useCallback(async (item) => {
    try {
      const result = await deleteCartItem(item);
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
    const pendingCartItem = sessionStorage.getItem('phonekh-pending-cart-item');
    if (pendingCartItem) {
      try {
        const item = JSON.parse(pendingCartItem);
        if (typeof item.productId !== 'string'
          || !Number.isInteger(item.quantity)
          || item.quantity < 1
          || typeof item.color !== 'string') {
          throw new Error('ព័ត៌មានទំនិញមិនត្រឹមត្រូវទេ។ សូមជ្រើសរើសផលិតផលម្ដងទៀត។');
        }
        const updatedCart = await addCartItem(item.productId, item.quantity, item.color);
        setCart(updatedCart);
        sessionStorage.removeItem('phonekh-pending-cart-item');
      } catch (error) {
        sessionStorage.removeItem('phonekh-pending-cart-item');
        setApiError(error.message);
      }
    }
    return authenticatedUser;
  }, [refreshCart, refreshOrders]);

  const signIn = useCallback((credentials) => authenticate(loginAccount, credentials), [authenticate]);
  const signUp = useCallback((details) => authenticate(registerAccount, details), [authenticate]);

  const saveUserProfile = useCallback(async (profile) => {
    const result = await updateUserProfile(profile);
    setUser(result.user);
    return result.user;
  }, []);

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
    const profileRequest = localStorage.getItem('phonekh-auth-token') ? fetchCurrentUser() : Promise.resolve(null);
    const [, , , profile] = await Promise.all([
      refreshCart(),
      refreshProducts(),
      refreshOrders(),
      profileRequest,
    ]);
    if (profile) setUser(profile.user);
    return order;
  }, [refreshCart, refreshProducts, refreshOrders]);

  const cancelOrder = useCallback(async (orderNumber, refundQr = '') => {
    const result = await submitOrderCancellation(orderNumber, refundQr);
    const [, , profile] = await Promise.all([refreshOrders(), refreshProducts(), fetchCurrentUser()]);
    setUser(profile.user);
    return result;
  }, [refreshOrders, refreshProducts]);

  const confirmRefundReceived = useCallback(async (orderNumber) => {
    const result = await confirmMyRefundReceived(orderNumber);
    await refreshOrders();
    return result;
  }, [refreshOrders]);

  const confirmOrderReceived = useCallback(async (orderNumber) => {
    const result = await confirmMyOrderReceived(orderNumber);
    await refreshOrders();
    return result;
  }, [refreshOrders]);

  const refreshAdmin = useCallback(async () => {
    const [summary, adminOrderList, users, contactMessages] = await Promise.all([
      fetchAdminSummary(),
      fetchAdminOrders(),
      fetchAdminUsers(),
      fetchAdminContactMessages(),
    ]);
    setAdminSummary(summary);
    setOrders(adminOrderList);
    setAdminUsers(users);
    setAdminContactMessages(contactMessages);
    return { summary, orders: adminOrderList, users, contactMessages };
  }, []);

  const markContactMessageRead = useCallback(async (id) => {
    const updated = await markAdminContactMessageRead(id);
    setAdminContactMessages((current) => current.map((entry) => entry._id === updated._id ? updated : entry));
    return updated;
  }, []);

  const replyToContactMessage = useCallback(async (id, body) => {
    const updated = await replyToAdminContactMessage(id, body);
    setAdminContactMessages((current) => current.map((entry) => entry._id === updated._id ? updated : entry));
    return updated;
  }, []);

  const deleteContactMessage = useCallback(async (id) => {
    await deleteAdminContactMessage(id);
    setAdminContactMessages((current) => current.filter((entry) => entry._id !== id));
  }, []);

  const setOrderStatus = useCallback(async (id, status) => {
    const order = await updateOrderStatus(id, status);
    setOrders((current) => current.map((entry) => entry._id === order._id ? order : entry));
    return order;
  }, []);

  const setPaymentStatus = useCallback(async (id, paymentStatus) => {
    const order = await updateOrderPaymentStatus(id, paymentStatus);
    setOrders((current) => current.map((entry) => entry._id === order._id ? order : entry));
    return order;
  }, []);

  const deleteOrder = useCallback(async (orderNumber) => {
    await removeAdminOrder(orderNumber);
    setOrders((current) => current.filter((entry) => entry.orderNumber !== orderNumber));
    await refreshProducts();
  }, [refreshProducts]);

  const markRefundSent = useCallback(async (orderNumber) => {
    const order = await markAdminRefundSent(orderNumber);
    setOrders((current) => current.map((entry) => entry._id === order._id ? order : entry));
    return order;
  }, []);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  const value = useMemo(() => ({
    products, setProducts, refreshProducts,
    cart, setCart, addToCart, queueCartItem, updateQuantity, removeFromCart, refreshCart, cartCount, cartTotal,
    orders, setOrders, refreshOrders, placeOrder, cancelOrder, confirmRefundReceived, confirmOrderReceived,
    user, setUser, signIn, signUp, signOut, saveUserProfile,
    adminUsers, adminSummary, adminContactMessages, refreshAdmin, markContactMessageRead, replyToContactMessage, deleteContactMessage, setOrderStatus, setPaymentStatus, deleteOrder, markRefundSent,
    loading, apiError, setApiError,
  }), [
    products, refreshProducts, cart, addToCart, queueCartItem, updateQuantity, removeFromCart, refreshCart,
    cartCount, cartTotal, orders, refreshOrders, placeOrder, cancelOrder, confirmRefundReceived, confirmOrderReceived, user, signIn, signUp, signOut, saveUserProfile,
    adminUsers, adminSummary, adminContactMessages, refreshAdmin, markContactMessageRead, replyToContactMessage, deleteContactMessage, setOrderStatus, setPaymentStatus, deleteOrder, markRefundSent, loading, apiError,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
