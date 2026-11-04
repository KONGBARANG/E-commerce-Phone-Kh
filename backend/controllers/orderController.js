const crypto = require('crypto');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { hashToken } = require('../utils/auth');

const maxReceiptBytes = 4 * 1024 * 1024;
const receiptDataUrlPattern = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const createOrder = async (req, res) => {
  const { customer, email = '', phone, address, note = '', payment, paymentProvider = '', paymentReceipt = '', couponCode = '' } = req.body;
  if (typeof couponCode !== 'string') return res.status(400).json({ message: 'Coupon code must be text.' });
  if (typeof customer !== 'string' || !customer.trim() || typeof phone !== 'string' || !/^[0-9+()\s-]{8,16}$/.test(phone.trim())) {
    return res.status(400).json({ message: 'Enter a valid customer name and phone number.' });
  }
  if (typeof address !== 'string' || !address.trim()) return res.status(400).json({ message: 'Shipping address is required.' });
  if (!['KHQR', 'COD'].includes(payment)) return res.status(400).json({ message: 'Select a supported payment method.' });
  if (payment === 'KHQR') {
    if (!['ABA', 'ACLEDA'].includes(paymentProvider)) return res.status(400).json({ message: 'Select ABA or ACLEDA for KHQR payment.' });
    const receiptMatch = typeof paymentReceipt === 'string' ? receiptDataUrlPattern.exec(paymentReceipt) : null;
    if (!receiptMatch || Buffer.from(receiptMatch[2], 'base64').length > maxReceiptBytes) {
      return res.status(400).json({ message: 'Upload a valid payment receipt image no larger than 4 MB.' });
    }
  }
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
    const color = line.color || '';
    if (product.colors.length ? !product.colors.includes(color) : Boolean(color)) {
      return res.status(409).json({ message: `Please choose an available color for ${product.name}.` });
    }
    lines.push({
      product: product._id,
      name: product.name,
      image: product.image,
      brand: product.brand,
      storage: product.storage,
      color,
      price: product.price,
      quantity: line.quantity,
    });
    subtotal += product.price * line.quantity;
  }

  let discountCode = '';
  let discount = 0;
  let couponToConsume = null;
  if (couponCode.trim()) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    if (!coupon) return res.status(400).json({ message: 'Coupon code is invalid or expired.' });
    if (coupon.owner && (!req.user || String(coupon.owner) !== String(req.user._id))) {
      return res.status(400).json({ message: 'Coupon code is invalid or expired.' });
    }
    if (subtotal < coupon.minimumSubtotal) {
      return res.status(400).json({ message: `This coupon requires a product subtotal of at least $${coupon.minimumSubtotal}.` });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'This coupon has already been used the maximum number of times.' });
    }
    discountCode = coupon.code;
    discount = coupon.discountAmount != null
      ? Math.min(subtotal, coupon.discountAmount)
      : Math.round(subtotal * coupon.discountPercent) / 100;
    if (coupon.maxUses != null) couponToConsume = coupon;
  }
  const shipping = subtotal - discount >= 300 ? 0 : 3;
  const orderNumber = `PK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const decremented = [];
  let couponReserved = false;
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
    if (couponToConsume) {
      const reservation = await Coupon.updateOne(
        {
          _id: couponToConsume._id,
          active: true,
          usedCount: { $lt: couponToConsume.maxUses },
        },
        { $inc: { usedCount: 1 } }
      );
      if (!reservation.modifiedCount) {
        throw Object.assign(new Error('This coupon has already been used the maximum number of times.'), { status: 400 });
      }
      couponReserved = true;
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
      paymentProvider: payment === 'KHQR' ? paymentProvider : '',
      paymentReceipt: payment === 'KHQR' ? paymentReceipt : '',
      paymentReceiptUploaded: payment === 'KHQR',
      items: lines,
      subtotal,
      discountCode,
      discount,
      shipping,
      total: subtotal - discount + shipping,
    });
    cart.items = [];
    await cart.save();
    const orderResponse = createdOrder.toObject();
    delete orderResponse.paymentReceipt;
    res.status(201).json(orderResponse);
  } catch (error) {
    if (createdOrder) await Order.deleteOne({ _id: createdOrder._id });
    if (couponReserved) await Coupon.updateOne({ _id: couponToConsume._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    await Promise.all(decremented.map((line) => Product.updateOne({ _id: line.product }, { $inc: { stock: line.quantity } })));
    throw error;
  }
};

const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).select('-paymentReceipt').sort({ createdAt: -1 }).lean();
  res.json(orders);
};

const getOrderByNumber = async (req, res) => {
  const token = req.get('x-cart-token');
  if (!req.user && !token) return res.status(401).json({ message: 'Order access token is required.' });
  const ownership = req.user ? { user: req.user._id } : { cartTokenHash: hashToken(token), user: null };
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, ...ownership }).select('-paymentReceipt').lean();
  if (!order) return res.status(404).json({ message: 'Order not found for this session.' });
  res.json(order);
};

const getAdminOrders = async (_req, res) => {
  const orders = await Order.find({})
    .select('-paymentReceipt')
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
  res.json(orders);
};

const getAdminPaymentReceipt = async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .select('+paymentReceipt orderNumber payment')
    .lean();
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!order.paymentReceipt) return res.status(404).json({ message: 'This order has no uploaded payment receipt.' });
  res.json({ orderNumber: order.orderNumber, paymentReceipt: order.paymentReceipt });
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

module.exports = { createOrder, getAdminOrders, getAdminPaymentReceipt, getAdminSummary, getMyOrders, getOrderByNumber, updateOrderStatus };
