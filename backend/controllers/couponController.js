const Coupon = require('../models/couponModel');

const validateCoupon = async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const coupon = await Coupon.findOne({
    code,
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();
  if (!coupon) return res.status(404).json({ message: 'Coupon code is invalid or expired.' });
  res.json({ code: coupon.code, discountPercent: coupon.discountPercent });
};

module.exports = { validateCoupon };
