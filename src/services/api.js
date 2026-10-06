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
  if (cartSessionRequest) return cartSessionRequest;
  cartSessionRequest = (async () => {
    const data = await request('/cart', { cart: true });
    if (!localStorage.getItem(CART_KEY) || data.token) localStorage.setItem(CART_KEY, data.token);
    return data.items;
  })();
  try {
    return await cartSessionRequest;
  } finally {
    cartSessionRequest = null;
  }
}

async function ensureCartSession() {
  if (localStorage.getItem(CART_KEY)) return;
  await fetchCart();
}

export async function addCartItem(productId, quantity = 1) {
  await ensureCartSession();
  return (await request(`/cart/${encodeURIComponent(productId)}`, { method: 'POST', body: { quantity }, cart: true })).items;
}

export async function setCartItemQuantity(productId, quantity) {
  await ensureCartSession();
  return (await request(`/cart/${encodeURIComponent(productId)}`, { method: 'PATCH', body: { quantity }, cart: true })).items;
}

export async function deleteCartItem(productId) {
  await ensureCartSession();
  return (await request(`/cart/${encodeURIComponent(productId)}`, { method: 'DELETE', cart: true })).items;
}

export async function registerAccount(details) {
  await fetchCart();
  const data = await request('/auth/register', { method: 'POST', body: details, cart: true });
  localStorage.setItem(AUTH_KEY, data.token);
  return data.user;
}

export async function loginAccount(credentials) {
  await fetchCart();
  const data = await request('/auth/login', { method: 'POST', body: credentials, cart: true });
  localStorage.setItem(AUTH_KEY, data.token);
  return data.user;
}

export const fetchCurrentUser = () => request('/auth/me', { auth: true });

export async function logoutAccount() {
  try {
    await request('/auth/logout', { method: 'POST', auth: true });
  } finally {
    localStorage.removeItem(AUTH_KEY);
  }
}

export const fetchMyOrders = () => request('/orders/mine', { auth: true });
export const fetchOrder = (orderNumber) => request(`/orders/${encodeURIComponent(orderNumber)}`, { cart: true });

export async function createOrder(order) {
  await ensureCartSession();
  return request('/orders', { method: 'POST', body: order, cart: true });
}

export const validateCoupon = (code) => request('/coupons/validate', { method: 'POST', body: { code } });
export const createProduct = (product) => request('/products', { method: 'POST', body: product, auth: true });
export const deleteProduct = (id) => request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
export const fetchAdminOrders = () => request('/orders/admin', { auth: true });
export const fetchAdminUsers = () => request('/orders/admin/users', { auth: true });
export const fetchAdminSummary = () => request('/orders/admin/summary', { auth: true });
export const setProduct = (product) => request(`/products/${encodeURIComponent(product._id)}`, { method: 'PATCH', body: product, auth: true });
export const setUserRole = (id, role) => request(`/orders/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: { role }, auth: true });
export const updateOrderStatus = (id, status) =>
  request(`/orders/admin/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, auth: true });
