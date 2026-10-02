const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/productModel');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max',
    category: 'Phone',
    price: 1199,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400',
    description: 'Apple iPhone 15 Pro Max 256GB',
    stock: 10
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Phone',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400',
    description: 'Samsung Galaxy S24 Ultra 512GB',
    stock: 8
  },
  {
    name: 'Fast Charger 65W GaN',
    category: 'Accessory',
    price: 29,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=400',
    description: 'Fast charging adapter for all smartphones',
    stock: 25
  }
];

const importData = async () => {
  try {
    await Product.deleteMany(); // លុបទិន្នន័យចាស់ចោលសិន
    await Product.insertMany(sampleProducts); // បញ្ចូលទិន្នន័យថ្មី
    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();