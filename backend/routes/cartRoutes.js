const express = require('express');
const { addItem, getOrCreateCart, removeItem, updateItem } = require('../controllers/cartController');
const validateObjectBody = require('../middleware/validateObjectBody');
const { requireAuth } = require('../utils/auth');

const router = express.Router();
router.get('/', requireAuth, getOrCreateCart);
router.post('/:productId', requireAuth, validateObjectBody, addItem);
router.patch('/:productId', requireAuth, validateObjectBody, updateItem);
router.delete('/:productId', requireAuth, removeItem);

module.exports = router;
