const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, min: 1, max: 100, required() { return this.discountAmount == null; } },
    discountAmount: { type: Number, min: 0 },
    minimumSubtotal: { type: Number, min: 0, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    maxUses: { type: Number, min: 1, default: null },
    usedCount: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
