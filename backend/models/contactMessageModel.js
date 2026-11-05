const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  replies: [{
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    authorRole: { type: String, enum: ['admin', 'customer'], required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['New', 'Read', 'Replied'], default: 'New' },
  customerReadAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
