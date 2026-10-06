const express = require('express');
const { createProduct, deleteProduct, getProducts, updateProduct } = require('../controllers/productController');
const { requireAdmin, requireAuth } = require('../utils/auth');
const validateObjectBody = require('../middleware/validateObjectBody');

const router = express.Router();
router.get('/', getProducts);
router.post('/', requireAuth, requireAdmin, validateObjectBody, createProduct);
router.patch('/:id', requireAuth, requireAdmin, validateObjectBody, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

module.exports = router;
