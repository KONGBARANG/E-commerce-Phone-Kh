const express = require('express');
const { addItem, getOrCreateCart, removeItem, updateItem } = require('../controllers/cartController');
const validateObjectBody = require('../middleware/validateObjectBody');

const router = express.Router();
router.get('/', getOrCreateCart);
router.post('/:productId', validateObjectBody, addItem);
router.patch('/:productId', validateObjectBody, updateItem);
router.delete('/:productId', removeItem);

module.exports = router;
