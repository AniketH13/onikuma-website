import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import { defaultCategories, defaultProducts, defaultSettings } from './seedData.js';

const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

let isMongoConnected = false;
let lastMongoError = null;

export function getMongoError() {
  return lastMongoError;
}

// In-memory cache/fallback for zero-downtime resilience
export const fallbackStore = {
  categories: JSON.parse(JSON.stringify(defaultCategories)).map((c, i) => ({ ...c, _id: 'cat_' + (i + 1), createdAt: new Date() })),
  // In production/Vercel, do not pre-populate phantom products so cleared catalog is respected
  products: isProd ? [] : JSON.parse(JSON.stringify(defaultProducts)).map((p, i) => ({ ...p, _id: 'prod_' + (i + 1), createdAt: new Date() })),
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
    lastMongoError = null;
    return;
  }

  // Safe display URI with masked credentials for logging
  const safeLogUri = uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'undefined';

  if (!cachedPromise) {
    console.log(`Connecting to MongoDB at: ${safeLogUri}...`);
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000
    }).then(async (m) => {
      isMongoConnected = true;
      lastMongoError = null;
      console.log('✅ MongoDB connected successfully!');
      try {
        // Only seeds data if database has never been initialized
        await autoSeedDatabase();
      } catch (seedErr) {
        console.warn('Auto-seed note:', seedErr.message);
      }
      return m;
    }).catch((error) => {
      cachedPromise = null;
      isMongoConnected = false;
      lastMongoError = error.message;
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
    // 1. If database has already been initialized, never re-seed products
    const isSeeded = await Setting.findOne({ key: 'system_seeded' });
    if (isSeeded && isSeeded.value) {
      return;
    }

    // 2. If settings or categories already exist from a past seed, mark as seeded and do not re-seed products
    const settingCount = await Setting.countDocuments();
    if (settingCount > 0) {
      await Setting.create({ key: 'system_seeded', value: true });
      return;
    }

    // 3. First-time initialization on a brand new empty database
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

    if (settingCount === 0) {
      console.log('🌱 Seeding default store settings to MongoDB...');
      for (const item of defaultSettings) {
        await Setting.create(item);
      }
      console.log('✅ Settings seeded successfully.');
    }

    await Setting.create({ key: 'system_seeded', value: true });
  } catch (err) {
    console.error('Error during auto-seeding:', err.message);
  }
}
