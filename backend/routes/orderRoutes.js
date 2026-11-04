const express = require('express');
const { createOrder, getAdminOrders, getAdminPaymentReceipt, getAdminSummary, getMyOrders, getOrderByNumber, updateOrderStatus } = require('../controllers/orderController');
const { getUsers, updateUserRole } = require('../controllers/adminController');
const { optionalAuth, requireAdmin, requireAuth } = require('../utils/auth');
const validateObjectBody = require('../middleware/validateObjectBody');

const router = express.Router();
router.post('/', optionalAuth, validateObjectBody, createOrder);
router.get('/mine', requireAuth, getMyOrders);
router.get('/admin/summary', requireAuth, requireAdmin, getAdminSummary);
router.get('/admin/users', requireAuth, requireAdmin, getUsers);
router.patch('/admin/users/:id', requireAuth, requireAdmin, validateObjectBody, updateUserRole);
router.get('/admin', requireAuth, requireAdmin, getAdminOrders);
router.get('/admin/:orderNumber/payment-receipt', requireAuth, requireAdmin, getAdminPaymentReceipt);
router.patch('/admin/:orderNumber', requireAuth, requireAdmin, validateObjectBody, updateOrderStatus);
router.get('/:orderNumber', optionalAuth, getOrderByNumber);

module.exports = router;
