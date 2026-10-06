const express = require('express');
const { addItem, getOrCreateCart, removeItem, updateItem } = require('../controllers/cartController');
const validateObjectBody = require('../middleware/validateObjectBody');
const { optionalAuth } = require('../utils/auth');

const router = express.Router();
router.get('/', optionalAuth, getOrCreateCart);
router.post('/:productId', optionalAuth, validateObjectBody, addItem);
router.patch('/:productId', optionalAuth, validateObjectBody, updateItem);
router.delete('/:productId', optionalAuth, removeItem);

module.exports = router;
