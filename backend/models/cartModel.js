const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, select: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Cart', cartSchema);
