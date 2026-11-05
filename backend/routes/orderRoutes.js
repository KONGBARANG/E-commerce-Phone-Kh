const express = require('express');
const {
  cancelMyOrder,
  confirmOrderRefundReceived,
  confirmOrderReceived,
  createOrder,
  deleteAdminOrder,
  getAdminOrders,
  getAdminPaymentReceipt,
  getAdminRefundQr,
  getAdminSummary,
  getMyOrders,
  markOrderRefundSent,
  getOrderByNumber,
  updateOrderStatus,
} = require('../controllers/orderController');
const { getUsers, updateUserRole } = require('../controllers/adminController');
const { optionalAuth, requireAdmin, requireAuth } = require('../utils/auth');
const validateObjectBody = require('../middleware/validateObjectBody');

const router = express.Router();
router.post('/', optionalAuth, validateObjectBody, createOrder);
router.get('/mine', requireAuth, getMyOrders);
router.patch('/mine/:orderNumber/cancel', requireAuth, validateObjectBody, cancelMyOrder);
router.patch('/mine/:orderNumber/refund-received', requireAuth, validateObjectBody, confirmOrderRefundReceived);
router.patch('/mine/:orderNumber/received', requireAuth, validateObjectBody, confirmOrderReceived);
router.get('/admin/summary', requireAuth, requireAdmin, getAdminSummary);
router.get('/admin/users', requireAuth, requireAdmin, getUsers);
router.patch('/admin/users/:id', requireAuth, requireAdmin, validateObjectBody, updateUserRole);
router.get('/admin', requireAuth, requireAdmin, getAdminOrders);
router.get('/admin/:orderNumber/payment-receipt', requireAuth, requireAdmin, getAdminPaymentReceipt);
router.get('/admin/:orderNumber/refund-qr', requireAuth, requireAdmin, getAdminRefundQr);
router.patch('/admin/:orderNumber/refund', requireAuth, requireAdmin, validateObjectBody, markOrderRefundSent);
router.delete('/admin/:orderNumber', requireAuth, requireAdmin, deleteAdminOrder);
router.patch('/admin/:orderNumber', requireAuth, requireAdmin, validateObjectBody, updateOrderStatus);
router.get('/:orderNumber', optionalAuth, getOrderByNumber);

module.exports = router;
