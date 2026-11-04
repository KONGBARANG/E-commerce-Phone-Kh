const express = require('express');
const { validateCoupon } = require('../controllers/couponController');
const validateObjectBody = require('../middleware/validateObjectBody');
const { optionalAuth } = require('../utils/auth');

const router = express.Router();
router.post('/validate', optionalAuth, validateObjectBody, validateCoupon);

module.exports = router;
