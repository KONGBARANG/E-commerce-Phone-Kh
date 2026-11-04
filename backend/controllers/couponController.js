const Coupon = require('../models/couponModel');

const validateCoupon = async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const subtotal = Number(req.body.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return res.status(400).json({ message: 'A valid order subtotal is required.' });
  }
  const coupon = await Coupon.findOne({
    code,
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  if (!coupon) return res.status(404).json({ message: 'Coupon code is invalid or expired.' });
  if (coupon.owner && (!req.user || String(coupon.owner) !== String(req.user._id))) {
    return res.status(404).json({ message: 'Coupon code is invalid or expired.' });
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return res.status(400).json({ message: 'This coupon has already been used the maximum number of times.' });
  }
  if (subtotal < coupon.minimumSubtotal) {
    return res.status(400).json({ message: `This coupon requires a product subtotal of at least $${coupon.minimumSubtotal}.` });
  }
  res.json({
    code: coupon.code,
    discountPercent: coupon.discountPercent || 0,
    discountAmount: coupon.discountAmount || 0,
    minimumSubtotal: coupon.minimumSubtotal || 0,
    remainingUses: coupon.maxUses == null ? null : coupon.maxUses - coupon.usedCount,
  });
};

module.exports = { validateCoupon };
