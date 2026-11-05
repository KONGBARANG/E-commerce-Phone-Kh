const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`.replace(/\/$/, '');
const AUTH_KEY = 'phonekh-auth-token';
const CART_KEY = 'phonekh-cart-token';
let cartSessionRequest;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = false, cart = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = localStorage.getItem(AUTH_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (cart) {
    const token = localStorage.getItem(CART_KEY);
    if (token) headers['X-Cart-Token'] = token;
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    const connectionError = new ApiError(`Cannot connect to PHONE KH backend at ${API_URL}. Start the backend and try again.`, 0);
    connectionError.cause = error;
    throw connectionError;
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.message || `Request failed (${response.status}).`, response.status);
  return data;
}

export const fetchProducts = () => request('/products');

export async function fetchCart() {
  const authToken = localStorage.getItem(AUTH_KEY) || '';
  if (cartSessionRequest?.authToken === authToken) return cartSessionRequest.promise;
  const pending = {
    authToken,
    promise: (async () => {
      const data = await request('/cart', { auth: true, cart: true });
      if (data.token) localStorage.setItem(CART_KEY, data.token);
      return data.items;
    })(),
  };
  cartSessionRequest = pending;
  try {
    return await pending.promise;
  } finally {
    if (cartSessionRequest === pending) cartSessionRequest = null;
  }
}

async function ensureCartSession() {
  if (localStorage.getItem(CART_KEY)) return;
  await fetchCart();
}

export async function addCartItem(productId, quantity = 1, color = '') {
  await ensureCartSession();
  return (await request(`/cart/${encodeURIComponent(productId)}`, { method: 'POST', body: { quantity, color }, auth: true, cart: true })).items;
}

export async function setCartItemQuantity(item, quantity) {
  await ensureCartSession();
  const color = new URLSearchParams({ color: item.selectedColor || '' });
  return (await request(`/cart/${encodeURIComponent(item._id)}?${color}`, { method: 'PATCH', body: { quantity }, auth: true, cart: true })).items;
}

export async function deleteCartItem(item) {
  await ensureCartSession();
  const color = new URLSearchParams({ color: item.selectedColor || '' });
  return (await request(`/cart/${encodeURIComponent(item._id)}?${color}`, { method: 'DELETE', auth: true, cart: true })).items;
}

export async function registerAccount(details) {
  const data = await request('/auth/register', { method: 'POST', body: details });
  localStorage.setItem(AUTH_KEY, data.token);
  return data.user;
}

export async function loginAccount(credentials) {
  const data = await request('/auth/login', { method: 'POST', body: credentials });
  localStorage.setItem(AUTH_KEY, data.token);
  return data.user;
}

export const fetchCurrentUser = () => request('/auth/me', { auth: true });
export const updateUserProfile = (profile) => request('/auth/profile', { method: 'PATCH', body: profile, auth: true });
export const submitContactMessage = (details) => request('/contact', { method: 'POST', body: details, auth: true });
export const fetchMyContactMessages = () => request('/contact/mine', { auth: true });
export const replyToMyContactMessage = (id, body) =>
  request(`/contact/mine/${encodeURIComponent(id)}/reply`, { method: 'POST', body: { body }, auth: true });
export const fetchAdminContactMessages = () => request('/contact/admin', { auth: true });
export const markAdminContactMessageRead = (id) =>
  request(`/contact/admin/${encodeURIComponent(id)}/read`, { method: 'PATCH', body: {}, auth: true });
export const replyToAdminContactMessage = (id, body) =>
  request(`/contact/admin/${encodeURIComponent(id)}/reply`, { method: 'POST', body: { body }, auth: true });
export const deleteAdminContactMessage = (id) =>
  request(`/contact/admin/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });

export async function logoutAccount() {
  try {
    await request('/auth/logout', { method: 'POST', auth: true });
  } finally {
    localStorage.removeItem(AUTH_KEY);
  }
}

export const fetchMyOrders = () => request('/orders/mine', { auth: true });
export const fetchOrder = (orderNumber) => request(`/orders/${encodeURIComponent(orderNumber)}`, { auth: true, cart: true });
export const cancelMyOrder = (orderNumber, refundQr = '') =>
  request(`/orders/mine/${encodeURIComponent(orderNumber)}/cancel`, { method: 'PATCH', body: { refundQr }, auth: true });
export const confirmMyRefundReceived = (orderNumber) =>
  request(`/orders/mine/${encodeURIComponent(orderNumber)}/refund-received`, { method: 'PATCH', body: {}, auth: true });
export const confirmMyOrderReceived = (orderNumber) =>
  request(`/orders/mine/${encodeURIComponent(orderNumber)}/received`, { method: 'PATCH', body: {}, auth: true });

export async function createOrder(order) {
  await ensureCartSession();
  return request('/orders', { method: 'POST', body: order, auth: true, cart: true });
}

export const validateCoupon = (code, subtotal, auth = false) =>
  request('/coupons/validate', { method: 'POST', body: { code, subtotal }, auth });
export const createProduct = (product) => request('/products', { method: 'POST', body: product, auth: true });
export const deleteProduct = (id) => request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
export const fetchAdminOrders = () => request('/orders/admin', { auth: true });
export const fetchAdminPaymentReceipt = (orderNumber) => request(`/orders/admin/${encodeURIComponent(orderNumber)}/payment-receipt`, { auth: true });
export const fetchAdminRefundQr = (orderNumber) => request(`/orders/admin/${encodeURIComponent(orderNumber)}/refund-qr`, { auth: true });
export const markAdminRefundSent = (orderNumber) =>
  request(`/orders/admin/${encodeURIComponent(orderNumber)}/refund`, { method: 'PATCH', body: {}, auth: true });
export const deleteAdminOrder = (orderNumber) =>
  request(`/orders/admin/${encodeURIComponent(orderNumber)}`, { method: 'DELETE', auth: true });
export const fetchAdminUsers = () => request('/orders/admin/users', { auth: true });
export const fetchAdminSummary = () => request('/orders/admin/summary', { auth: true });
export const setProduct = (product) => request(`/products/${encodeURIComponent(product._id)}`, { method: 'PATCH', body: product, auth: true });
export const setUserRole = (id, role) => request(`/orders/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: { role }, auth: true });
export const updateOrderStatus = (id, status) =>
  request(`/orders/admin/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, auth: true });
export const updateOrderPaymentStatus = (id, paymentStatus) =>
  request(`/orders/admin/${encodeURIComponent(id)}`, { method: 'PATCH', body: { paymentStatus }, auth: true });
