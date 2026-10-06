const Product = require('../models/productModel');

const getProducts = async (_req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  res.json(products);
};

const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const fields = ['name', 'brand', 'category', 'price', 'oldPrice', 'image', 'description', 'storage', 'ram', 'stock', 'rating', 'badge'];
  const updates = Object.fromEntries(fields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ message: 'Product deleted.' });
};

module.exports = { createProduct, deleteProduct, getProducts, updateProduct };
