import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import { defaultCategories, defaultProducts, defaultSettings } from './seedData.js';

let isMongoConnected = false;

// In-memory cache/fallback for zero-downtime resilience
export const fallbackStore = {
  categories: JSON.parse(JSON.stringify(defaultCategories)).map((c, i) => ({ ...c, _id: 'cat_' + (i + 1), createdAt: new Date() })),
  products: JSON.parse(JSON.stringify(defaultProducts)).map((p, i) => ({ ...p, _id: 'prod_' + (i + 1), createdAt: new Date() })),
  orders: [],
  settings: {
    hotline: '9864006883',
    whatsapp: '9864006883',
    storeName: 'Onikuma Nepal',
    announcement: '🔥 Official Importer & Distributor of ONIKUMA Gaming in Nepal | Delivery Across All 77 Districts | WhatsApp Support: 9864006883',
    freeDeliveryThreshold: 3000,
    insideValleyDeliveryFee: 100,
    outsideValleyDeliveryFee: 200,
    promoCodes: [
      { code: 'ONIKUMA10', discountPercent: 10, minSpend: 1500 },
      { code: 'FIRSTORDER', discountPercent: 5, minSpend: 1000 }
    ]
  }
};

// Disable command buffering so operations fail fast and fallback store answers instantly
mongoose.set('bufferCommands', false);

let cachedPromise = null;

export async function connectDB(uri) {
  // If already connected, return immediately
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return;
  }

  // Safe display URI with masked credentials for logging
  const safeLogUri = uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'undefined';

  if (!cachedPromise) {
    console.log(`Connecting to MongoDB at: ${safeLogUri}...`);
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000
    }).then(async (m) => {
      isMongoConnected = true;
      console.log('✅ MongoDB connected successfully!');
      // Check & Seed data if collections are empty (seeds cloud or local DB on first run)
      await autoSeedDatabase();
      return m;
    }).catch((error) => {
      cachedPromise = null;
      isMongoConnected = false;
      console.warn('⚠️ Could not connect to MongoDB:', error.message);
      console.warn('💡 Using resilient in-memory fallback store so the storefront and admin panel remain 100% functional.');
      console.warn('💡 Target URI was: ' + safeLogUri);
    });
  }

  try {
    await cachedPromise;
  } catch (e) {
    // Handled in catch block above
  }
}

export function getMongoStatus() {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}

export async function autoSeedDatabase() {
  try {
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      console.log('🌱 Seeding default Onikuma categories to MongoDB...');
      await Category.insertMany(defaultCategories);
      console.log('✅ Categories seeded successfully.');
    }

    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      console.log('🌱 Seeding default Onikuma products to MongoDB...');
      await Product.insertMany(defaultProducts);
      console.log('✅ Products seeded successfully.');
    }

    const settingCount = await Setting.countDocuments();
    if (settingCount === 0) {
      console.log('🌱 Seeding default store settings to MongoDB...');
      for (const item of defaultSettings) {
        await Setting.create(item);
      }
      console.log('✅ Settings seeded successfully.');
    }
  } catch (err) {
    console.error('Error during auto-seeding:', err.message);
  }
}
