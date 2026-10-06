const crypto = require('crypto');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const { hashToken } = require('../utils/auth');

const cartView = async (cart) => {
  await cart.populate('items.product');
  return cart.items
    .filter((item) => item.product)
    .map((item) => ({ ...item.product.toObject(), quantity: item.quantity }));
};

const getOrCreateCart = async (req, res) => {
  const providedToken = req.get('x-cart-token');
  const token = providedToken || crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  let cart = await Cart.findOne({ tokenHash }).select('+tokenHash');
  if (!cart) {
    cart = await Cart.create({ tokenHash, items: [], expiresAt: new Date(Date.now() + 30 * 86400000) });
  } else {
    cart.expiresAt = new Date(Date.now() + 30 * 86400000);
    await cart.save();
  }
  res.json({ token, items: await cartView(cart) });
};

const addItem = async (req, res) => {
  const cart = await Cart.findOne({ tokenHash: hashToken(req.get('x-cart-token') || '') });
  if (!cart) return res.status(401).json({ message: 'Your cart session has expired. Refresh the page and try again.' });
  const { productId } = req.params;
  const quantity = Number(req.body.quantity || 1);
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const line = cart.items.find((item) => String(item.product) === productId);
  const nextQuantity = (line?.quantity || 0) + quantity;
  if (nextQuantity > product.stock) return res.status(409).json({ message: `Only ${product.stock} unit(s) are available.` });
  if (line) line.quantity = nextQuantity;
  else cart.items.push({ product: product._id, quantity });
  cart.expiresAt = new Date(Date.now() + 30 * 86400000);
  await cart.save();
  res.json({ items: await cartView(cart) });
};

const updateItem = async (req, res) => {
  const cart = await Cart.findOne({ tokenHash: hashToken(req.get('x-cart-token') || '') });
  if (!cart) return res.status(401).json({ message: 'Your cart session has expired. Refresh the page and try again.' });
  const line = cart.items.find((item) => String(item.product) === req.params.productId);
  if (!line) return res.status(404).json({ message: 'Cart item not found.' });
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ message: 'Quantity must be zero or a positive whole number.' });
  if (quantity === 0) cart.items.pull({ product: req.params.productId });
  else {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (quantity > product.stock) return res.status(409).json({ message: `Only ${product.stock} unit(s) are available.` });
    line.quantity = quantity;
  }
  await cart.save();
  res.json({ items: await cartView(cart) });
};

const removeItem = async (req, res) => {
  const cart = await Cart.findOne({ tokenHash: hashToken(req.get('x-cart-token') || '') });
  if (!cart) return res.status(401).json({ message: 'Your cart session has expired. Refresh the page and try again.' });
  cart.items.pull({ product: req.params.productId });
  await cart.save();
  res.json({ items: await cartView(cart) });
};

module.exports = { addItem, getOrCreateCart, removeItem, updateItem };
