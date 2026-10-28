const crypto = require('crypto');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const { hashToken } = require('../utils/auth');

const getCartForRequest = async (req) => {
  if (req.user) {
    const carts = await Cart.find({ user: req.user._id }).sort({ updatedAt: -1 });
    if (carts.length < 2) return carts[0] || null;
    const [cart, ...duplicates] = carts;
    const quantities = new Map();
    for (const item of carts.flatMap((entry) => entry.items)) {
      const productId = String(item.product);
      const color = item.color || '';
      const key = `${productId}\u0000${color}`;
      const existing = quantities.get(key);
      quantities.set(key, {
        product: item.product,
        color,
        quantity: (existing?.quantity || 0) + item.quantity,
      });
    }
    cart.items = [...quantities.values()];
    cart.expiresAt = undefined;
    await cart.save();
    await Cart.deleteMany({ _id: { $in: duplicates.map((entry) => entry._id) }, user: req.user._id });
    return cart;
  }
  const token = req.get('x-cart-token');
  if (!token) return null;
  return Cart.findOne({ tokenHash: hashToken(token), user: null });
};

const cartView = async (cart) => {
  await cart.populate('items.product');
  return cart.items
    .filter((item) => item.product)
    .map((item) => ({ ...item.product.toObject(), quantity: item.quantity, selectedColor: item.color || '' }));
};

const getOrCreateCart = async (req, res) => {
  const providedToken = req.get('x-cart-token');
  let cart = await getCartForRequest(req);
  let token;
  if (!cart) {
    const tokenAlreadyUsed = providedToken && await Cart.exists({ tokenHash: hashToken(providedToken) });
    token = req.user || !providedToken || tokenAlreadyUsed
      ? crypto.randomBytes(32).toString('hex')
      : providedToken;
    cart = await Cart.create({
      tokenHash: hashToken(token),
      user: req.user?._id || null,
      items: [],
      ...(req.user ? {} : { expiresAt: new Date(Date.now() + 30 * 86400000) }),
    });
  } else {
    if (req.user) cart.expiresAt = undefined;
    else cart.expiresAt = new Date(Date.now() + 30 * 86400000);
    await cart.save();
  }
  res.json({ ...(token ? { token } : {}), items: await cartView(cart) });
};

const addItem = async (req, res) => {
  const cart = await getCartForRequest(req);
  if (!cart) return res.status(401).json({ message: 'Your cart session has expired. Refresh the page and try again.' });
  const { productId } = req.params;
  const quantity = Number(req.body.quantity || 1);
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  if (req.body.color !== undefined && typeof req.body.color !== 'string') {
    return res.status(400).json({ message: 'Select a valid product color.' });
  }
  const color = typeof req.body.color === 'string' ? req.body.color.trim() : '';
  if (product.colors.length ? !product.colors.includes(color) : Boolean(color)) {
    return res.status(400).json({ message: 'Select an available color for this product.' });
  }
  const line = cart.items.find((item) => String(item.product) === productId && (item.color || '') === color);
  const nextQuantity = (line?.quantity || 0) + quantity;
  const productQuantity = cart.items
    .filter((item) => String(item.product) === productId)
    .reduce((total, item) => total + item.quantity, 0);
  if (productQuantity + quantity > product.stock) return res.status(409).json({ message: `Only ${product.stock} unit(s) are available.` });
  if (line) line.quantity = nextQuantity;
  else cart.items.push({ product: product._id, quantity, color });
  if (req.user) cart.expiresAt = undefined;
  else cart.expiresAt = new Date(Date.now() + 30 * 86400000);
  await cart.save();
  res.json({ items: await cartView(cart) });
};

const updateItem = async (req, res) => {
  const cart = await getCartForRequest(req);
  if (!cart) return res.status(401).json({ message: 'Your cart session has expired. Refresh the page and try again.' });
  const color = typeof req.query.color === 'string' ? req.query.color : '';
  const line = cart.items.find((item) => String(item.product) === req.params.productId && (item.color || '') === color);
  if (!line) return res.status(404).json({ message: 'Cart item not found.' });
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ message: 'Quantity must be zero or a positive whole number.' });
  if (quantity === 0) cart.items.pull(line._id);
  else {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const otherColorQuantity = cart.items
      .filter((item) => String(item.product) === req.params.productId && item !== line)
      .reduce((total, item) => total + item.quantity, 0);
    if (otherColorQuantity + quantity > product.stock) return res.status(409).json({ message: `Only ${product.stock} unit(s) are available.` });
    line.quantity = quantity;
  }
  await cart.save();
  res.json({ items: await cartView(cart) });
};

const removeItem = async (req, res) => {
  const cart = await getCartForRequest(req);
  if (!cart) return res.status(401).json({ message: 'Your cart session has expired. Refresh the page and try again.' });
  const color = typeof req.query.color === 'string' ? req.query.color : '';
  const line = cart.items.find((item) => String(item.product) === req.params.productId && (item.color || '') === color);
  if (line) cart.items.pull(line._id);
  await cart.save();
  res.json({ items: await cartView(cart) });
};

module.exports = { addItem, getOrCreateCart, removeItem, updateItem };
