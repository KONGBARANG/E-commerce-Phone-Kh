const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cartTokenHash: { type: String, required: true, select: false },
    customer: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true },
    payment: { type: String, enum: ['KHQR', 'COD'], required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        image: { type: String, required: true },
        brand: { type: String, default: '' },
        storage: { type: String, default: '' },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discountCode: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
