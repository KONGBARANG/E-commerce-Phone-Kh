const crypto = require('crypto');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { hashToken } = require('../utils/auth');

const maxReceiptBytes = 4 * 1024 * 1024;
const receiptDataUrlPattern = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const isValidImage = (image) => {
  const match = typeof image === 'string' ? receiptDataUrlPattern.exec(image) : null;
  return Boolean(match && Buffer.from(match[2], 'base64').length <= maxReceiptBytes);
};

const releaseOrderResources = async (order) => {
  await Promise.all([
    ...order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })),
    ...(order.discountCode
      ? [Coupon.updateOne({ code: order.discountCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } })]
      : []),
  ]);
};

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

const cancelMyOrder = async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!['Pending', 'Processing'].includes(order.status)) {
    return res.status(409).json({ message: 'Only pending or processing orders can be cancelled.' });
  }
  if (order.payment === 'KHQR' && !isValidImage(req.body.refundQr)) {
    return res.status(400).json({ message: 'Upload a valid ABA/ACLEDA refund QR image no larger than 4 MB.' });
  }

  const refundStatus = order.payment === 'KHQR' ? 'Requested' : 'NotRequired';
  const cancelledOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: { $in: ['Pending', 'Processing'] } },
    { $set: { status: 'Cancelled', refundStatus, refundQr: refundStatus === 'Requested' ? req.body.refundQr : '' } },
    { new: true, runValidators: true }
  );
  if (!cancelledOrder) return res.status(409).json({ message: 'This order has already been updated.' });
  await releaseOrderResources(cancelledOrder);
  res.json(cancelledOrder);
};

const deleteAdminOrder = async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.payment !== 'COD') {
    return res.status(403).json({ message: 'Administrators can delete COD orders only.' });
  }
  const deletedOrder = await Order.findOneAndDelete({ _id: order._id, payment: 'COD' });
  if (!deletedOrder) return res.status(409).json({ message: 'This order has already been updated.' });
  if (['Pending', 'Processing'].includes(deletedOrder.status)) await releaseOrderResources(deletedOrder);
  res.json({ message: 'COD order deleted.' });
};

const getAdminRefundQr = async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .select('+refundQr orderNumber refundStatus')
    .lean();
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!order.refundQr || order.refundStatus !== 'Requested') {
    return res.status(404).json({ message: 'This order has no pending refund QR.' });
  }
  res.json({ orderNumber: order.orderNumber, refundQr: order.refundQr, refundStatus: order.refundStatus });
};

const markOrderRefundSent = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { orderNumber: req.params.orderNumber, status: 'Cancelled', refundStatus: 'Requested' },
    { $set: { refundStatus: 'Sent' } },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(409).json({ message: 'No pending refund was found for this order.' });
  res.json(order);
};

const confirmOrderRefundReceived = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { orderNumber: req.params.orderNumber, user: req.user._id, status: 'Cancelled', refundStatus: { $in: ['Sent', 'Completed'] } },
    { $set: { refundStatus: 'Received' } },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(409).json({ message: 'No sent refund is awaiting confirmation for this order.' });
  res.json(order);
};

const confirmOrderReceived = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { orderNumber: req.params.orderNumber, user: req.user._id, status: 'Completed' },
    { $set: { status: 'Received' } },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(409).json({ message: 'No completed order is awaiting your receipt confirmation.' });
  res.json(order);
};

const updateOrderStatus = async (req, res) => {
  const updates = {};
  if (req.body.status !== undefined) {
    const statuses = ['Pending', 'Processing', 'Completed', 'Received', 'Cancelled'];
    if (!statuses.includes(req.body.status)) return res.status(400).json({ message: 'Unsupported order status.' });
    if (['Cancelled', 'Received'].includes(req.body.status)) {
      return res.status(400).json({ message: 'This order status can only be set by the customer confirmation action.' });
    }
    updates.status = req.body.status;
  }
  let order;
  if (req.body.paymentStatus !== undefined) {
    if (!['Unpaid', 'Paid'].includes(req.body.paymentStatus)) {
      return res.status(400).json({ message: 'Unsupported payment status.' });
    }
    updates.paymentStatus = req.body.paymentStatus;
  }
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide an order or payment status.' });
  order = await Order.findOne({ orderNumber: req.params.orderNumber, status: { $ne: 'Cancelled' } });
  if (!order) return res.status(404).json({ message: 'Order not found or already cancelled.' });
  if (updates.status === 'Processing' && order.status !== 'Pending') {
    return res.status(409).json({ message: 'Only pending orders can be moved to processing.' });
  }
  if (updates.status === 'Completed' && order.status !== 'Processing') {
    return res.status(409).json({ message: 'Only processing orders can be marked completed.' });
  }
  if (updates.status === 'Pending' && order.status !== 'Pending') {
    return res.status(409).json({ message: 'Order progress cannot be moved backwards.' });
  }
  if (updates.paymentStatus === 'Paid' && order.payment === 'KHQR' && !order.paymentReceiptUploaded) {
    return res.status(409).json({ message: 'Verify the uploaded KHQR payment receipt before confirming payment.' });
  }
  if (updates.paymentStatus === 'Unpaid' && order.status !== 'Pending') {
    return res.status(409).json({ message: 'Payment cannot be reverted after order preparation has started.' });
  }
  const nextPaymentStatus = updates.paymentStatus || order.paymentStatus;
  const nextOrderStatus = updates.status || order.status;
  if (order.payment === 'KHQR' && ['Processing', 'Completed'].includes(nextOrderStatus) && nextPaymentStatus !== 'Paid') {
    return res.status(409).json({ message: 'Confirm the KHQR payment before preparing or completing this order.' });
  }
  order = await Order.findOneAndUpdate(
    { orderNumber: req.params.orderNumber, status: { $ne: 'Cancelled' } },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(404).json({ message: 'Order not found or already cancelled.' });
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
    completedCount: orders.filter((order) => ['Completed', 'Received'].includes(order.status)).length,
    processingCount: orders.filter((order) => order.status === 'Processing').length,
  });
};

module.exports = {
  cancelMyOrder,
  markOrderRefundSent,
  confirmOrderRefundReceived,
  confirmOrderReceived,
  createOrder,
  deleteAdminOrder,
  getAdminOrders,
  getAdminPaymentReceipt,
  getAdminRefundQr,
  getAdminSummary,
  getMyOrders,
  getOrderByNumber,
  updateOrderStatus,
};
