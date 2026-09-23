import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, getMongoStatus, autoSeedDatabase } from './db/connect.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';

import uploadRouter from './routes/upload.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 5000;

// Environment-based Database Selection:
// - Local development: uses local MongoDB (mongodb://127.0.0.1:27017) with in-memory fallback to preserve local test data
// - Vercel or VPS deployment: uses cloud MongoDB Atlas URI via MONGODB_URI environment variable
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const MONGODB_URI = process.env.MONGODB_URI || (
  isProduction
    ? 'mongodb+srv://anikethyoju_db_user:4aHQEbNob4cfJAWH@mydatabase.gimb44k.mongodb.net/onikuma_nepal?retryWrites=true&w=majority'
    : 'mongodb://127.0.0.1:27017/onikuma_nepal'
);

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static frontend files (including uploaded media)
app.use(express.static(path.join(rootDir, 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/analytics', analyticsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: isProduction ? 'production' : 'development',
    store: 'Onikuma Nepal Official Store API',
    mongoConnected: getMongoStatus(),
    timestamp: new Date()
  });
});

// Seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    if (getMongoStatus()) {
      await autoSeedDatabase();
      return res.json({ success: true, message: 'Database re-seeded successfully' });
    }
    return res.json({ success: true, message: 'In-memory store is active and seeded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin redirect / fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'admin.html'));
});

// Dedicated Products Catalog Page
app.get('/products', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'products.html'));
});

// Dedicated Single Product Details Page
app.get('/product', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'product.html'));
});

// Dedicated Checkout Page
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'checkout.html'));
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

// Start Server for local and standalone VPS environments
async function startServer() {
  await connectDB(MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 ONIKUMA NEPAL SERVER RUNNING`);
    console.log(`📍 Environment:      ${isProduction ? 'PRODUCTION / VPS' : 'LOCAL TESTING (Development)'}`);
    console.log(`📍 Local Storefront: http://localhost:${PORT}`);
    console.log(`📍 Admin Dashboard:  http://localhost:${PORT}/admin`);
    console.log(`📍 REST API Health:  http://localhost:${PORT}/api/health`);
    console.log(`📞 Customer Support: +977 9864006883`);
    console.log(`======================================================\n`);
  });
}

// In Vercel serverless functions, Vercel manages the HTTP server lifecycle
if (!process.env.VERCEL) {
  startServer();
}

export default app;
