const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    brand: { type: String, default: '', trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    image: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 3000 },
    storage: { type: String, default: '' },
    ram: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    badge: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);