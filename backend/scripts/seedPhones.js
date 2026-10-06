const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../config/db');
const Product = require('../models/productModel');
const phoneCatalog = require('../data/phoneCatalog');

async function seedPhones() {
  if (phoneCatalog.length !== 50) {
    throw new Error(`Expected exactly 50 phone records, got ${phoneCatalog.length}.`);
  }
  await connectDB();
  await Product.createIndexes();

  const operations = phoneCatalog.map(({ sku, legacyName, category, image, name, brand, description, storage, ram, ...product }) => ({
    updateOne: {
      filter: { $or: [{ sku }, { name: legacyName }] },
      update: {
        $set: { name, brand, description, storage, ram, sku, category, image },
        $setOnInsert: product,
      },
      upsert: true,
    },
  }));
  const result = await Product.bulkWrite(operations, { ordered: false });
  const totalPhones = await Product.countDocuments({ category: 'Smartphone' });

  console.log(`Phone catalog processed: ${phoneCatalog.length}`);
  console.log(`New phone records inserted: ${result.upsertedCount}`);
  console.log(`Existing matching products kept: ${result.matchedCount}`);
  console.log(`Smartphone records now in database: ${totalPhones}`);
  const uniqueImages = await Product.distinct('image', { sku: { $in: phoneCatalog.map((product) => product.sku) } });
  console.log(`Unique phone photo URLs in database: ${uniqueImages.length}`);
  if (uniqueImages.length !== phoneCatalog.length || uniqueImages.some((image) => !image.startsWith('https://images.unsplash.com/photo-'))) {
    throw new Error(`Expected 50 unique Unsplash phone photo URLs in the database; found ${uniqueImages.length}.`);
  }
  console.log('Catalog names now describe their photos; unverified brand/model/storage/RAM fields were removed.');
}

seedPhones()
  .catch((error) => {
    console.error(`Unable to seed phone catalog: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
  });
