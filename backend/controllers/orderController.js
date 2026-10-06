const crypto = require('crypto');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { hashToken } = require('../utils/auth');

const createOrder = async (req, res) => {
  const { customer, email = '', phone, address, note = '', payment, couponCode = '' } = req.body;
  if (typeof customer !== 'string' || !customer.trim() || typeof phone !== 'string' || !/^[0-9+()\s-]{8,16}$/.test(phone.trim())) {
    return res.status(400).json({ message: 'Enter a valid customer name and phone number.' });
  }
  if (typeof address !== 'string' || !address.trim()) return res.status(400).json({ message: 'Shipping address is required.' });
  if (!['KHQR', 'COD'].includes(payment)) return res.status(400).json({ message: 'Select a supported payment method.' });
  const token = req.get('x-cart-token');
  if (!req.user && !token) return res.status(401).json({ message: 'Your cart session is missing. Refresh the page and try again.' });
  const tokenHash = token ? hashToken(token) : '';
  const cartQuery = req.user ? { user: req.user._id } : { tokenHash, user: null };
  const cart = await Cart.findOne(cartQuery).populate('items.product');
  if (!cart || !cart.items.length) return res.status(400).json({ message: 'Your cart is empty.' });

  const lines = [];
  let subtotal = 0;
  for (const line of cart.items) {
    const product = line.product;
    if (!product) return res.status(409).json({ message: 'A product in your cart is no longer available.' });
    if (line.quantity > product.stock) return res.status(409).json({ message: `Only ${product.stock} unit(s) of ${product.name} are available.` });
    lines.push({
      product: product._id,
      name: product.name,
      image: product.image,
      brand: product.brand,
      storage: product.storage,
      price: product.price,
      quantity: line.quantity,
    });
    subtotal += product.price * line.quantity;
  }

  let discountCode = '';
  let discount = 0;
  if (couponCode.trim()) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    if (!coupon) return res.status(400).json({ message: 'Coupon code is invalid or expired.' });
    discountCode = coupon.code;
    discount = Math.round(subtotal * coupon.discountPercent) / 100;
  }
  const shipping = subtotal - discount >= 300 ? 0 : 3;
  const orderNumber = `PK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const decremented = [];
  let createdOrder;
  try {
    for (const line of lines) {
      const product = await Product.findOneAndUpdate(
        { _id: line.product, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
        { new: true }
      );
      if (!product) throw Object.assign(new Error(`Insufficient stock for ${line.name}.`), { status: 409 });
      decremented.push(line);
    }
    createdOrder = await Order.create({
      orderNumber,
      user: req.user?._id || null,
      cartTokenHash: tokenHash,
      customer: req.user?.name || customer.trim(),
      email: req.user?.email || String(email).trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      note: String(note).trim(),
      payment,
      items: lines,
      subtotal,
      discountCode,
      discount,
      shipping,
      total: subtotal - discount + shipping,
    });
    cart.items = [];
    await cart.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    if (createdOrder) await Order.deleteOne({ _id: createdOrder._id });
    await Promise.all(decremented.map((line) => Product.updateOne({ _id: line.product }, { $inc: { stock: line.quantity } })));
    throw error;
  }
};

const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(orders);
};

const getOrderByNumber = async (req, res) => {
  const token = req.get('x-cart-token');
  if (!req.user && !token) return res.status(401).json({ message: 'Order access token is required.' });
  const ownership = req.user ? { user: req.user._id } : { cartTokenHash: hashToken(token), user: null };
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, ...ownership }).lean();
  if (!order) return res.status(404).json({ message: 'Order not found for this session.' });
  res.json(order);
};

const getAdminOrders = async (_req, res) => {
  const orders = await Order.find({})
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
  res.json(orders);
};

const updateOrderStatus = async (req, res) => {
  const updates = {};
  if (req.body.status !== undefined) {
    const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    if (!statuses.includes(req.body.status)) return res.status(400).json({ message: 'Unsupported order status.' });
    updates.status = req.body.status;
  }
  if (req.body.paymentStatus !== undefined) {
    if (!['Unpaid', 'Paid'].includes(req.body.paymentStatus)) {
      return res.status(400).json({ message: 'Unsupported payment status.' });
    }
    updates.paymentStatus = req.body.paymentStatus;
  }
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide an order or payment status.' });
  const order = await Order.findOneAndUpdate(
    { orderNumber: req.params.orderNumber },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
};

const getAdminSummary = async (_req, res) => {
  const [productCount, userCount, orders] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Order.find({}).select('total status paymentStatus').lean(),
  ]);
  res.json({
    productCount,
    userCount,
    orderCount: orders.length,
    sales: orders
      .filter((order) => order.status !== 'Cancelled' && order.paymentStatus === 'Paid')
      .reduce((sum, order) => sum + order.total, 0),
    completedCount: orders.filter((order) => order.status === 'Completed').length,
    processingCount: orders.filter((order) => order.status === 'Processing').length,
  });
};

module.exports = { createOrder, getAdminOrders, getAdminSummary, getMyOrders, getOrderByNumber, updateOrderStatus };
