const express = require('express');
const {
  createContactMessage,
  deleteContactMessage,
  getContactMessages,
  getMyContactMessages,
  markContactMessageRead,
  replyToContactMessage,
  replyToMyContactMessage,
} = require('../controllers/contactController');
const { requireAdmin, requireAuth } = require('../utils/auth');
const validateObjectBody = require('../middleware/validateObjectBody');

const router = express.Router();
router.post('/', requireAuth, validateObjectBody, createContactMessage);
router.get('/mine', requireAuth, getMyContactMessages);
router.post('/mine/:id/reply', requireAuth, validateObjectBody, replyToMyContactMessage);
router.get('/admin', requireAuth, requireAdmin, getContactMessages);
router.patch('/admin/:id/read', requireAuth, requireAdmin, validateObjectBody, markContactMessageRead);
router.post('/admin/:id/reply', requireAuth, requireAdmin, validateObjectBody, replyToContactMessage);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteContactMessage);

module.exports = router;
