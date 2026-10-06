const mongoose = require('mongoose');
const dns = require('dns');

// កំណត់ឱ្យប្រើ Google DNS ដើម្បីដោះស្រាយបញ្ហា querySrv
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required.');
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;