const express = require('express');
const { validateCoupon } = require('../controllers/couponController');
const validateObjectBody = require('../middleware/validateObjectBody');

const router = express.Router();
router.post('/validate', validateObjectBody, validateCoupon);

module.exports = router;
