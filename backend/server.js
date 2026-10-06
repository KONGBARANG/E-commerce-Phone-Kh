const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const Product = require('./models/productModel');
const Coupon = require('./models/couponModel');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const seedProducts = require('./data/seedProducts');
const { seedAdmin } = require('./controllers/authController');

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by CORS.'));
  },
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cart-Token'],
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

app.get('/', (_req, res) => res.send('PHONE KH API is running...'));
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(404).json({ message: 'Requested record was not found.' });
  if (error.status) return res.status(error.status).json({ message: error.message });
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const initializeDatabase = async () => {
  await connectDB();
  if (await Product.estimatedDocumentCount() === 0) {
    await Product.insertMany(seedProducts);
    console.log(`Seeded ${seedProducts.length} sample products.`);
  }
  await Coupon.updateOne(
    { code: 'PHONE10' },
    { $setOnInsert: { code: 'PHONE10', discountPercent: 10, active: true } },
    { upsert: true }
  );
  await seedAdmin();
};

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      const port = process.env.PORT || 5000;
      app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch((error) => {
      console.error(`Unable to initialize PHONE KH API: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { app, initializeDatabase };
