import express from 'express';
import Product from '../models/Product.js';
import { getMongoStatus, fallbackStore } from '../db/connect.js';

const router = express.Router();

// GET products with optional filters: category, search, tag, limit
router.get('/', async (req, res) => {
  try {
    const { category, search, badge, deal, featured, catear, limit } = req.query;

    if (getMongoStatus()) {
      const filter = {};
      if (category && category !== 'all') {
        filter.$or = [
          { categorySlug: category },
          { category: new RegExp(category, 'i') }
        ];
      }
      if (search) {
        filter.$or = [
          { title: new RegExp(search, 'i') },
          { modelCode: new RegExp(search, 'i') },
          { shortDesc: new RegExp(search, 'i') }
        ];
      }
      if (badge) {
        filter.badge = badge;
      }
      if (deal === 'true') {
        filter.isDeal = true;
      }
      if (featured === 'true') {
        filter.isFeatured = true;
      }
      if (catear === 'true') {
        filter.isCatEarSpecial = true;
      }

      let query = Product.find(filter).sort({ createdAt: -1 });
      if (limit) {
        query = query.limit(Number(limit));
      }
      const products = await query.exec();
      return res.json({ success: true, count: products.length, data: products });
    }

    // Fallback store filter
    let list = [...fallbackStore.products];
    if (category && category !== 'all') {
      list = list.filter(p => p.categorySlug === category || p.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || (p.modelCode && p.modelCode.toLowerCase().includes(q)) || p.shortDesc.toLowerCase().includes(q));
    }
    if (badge) {
      list = list.filter(p => p.badge === badge);
    }
    if (deal === 'true') {
      list = list.filter(p => p.isDeal);
    }
    if (featured === 'true') {
      list = list.filter(p => p.isFeatured);
    }
    if (catear === 'true') {
      list = list.filter(p => p.isCatEarSpecial);
    }
    if (limit) {
      list = list.slice(0, Number(limit));
    }
    return res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single product by id or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    if (getMongoStatus()) {
      let prod = null;
      if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        prod = await Product.findById(idOrSlug);
      }
      if (!prod) {
        prod = await Product.findOne({ slug: idOrSlug });
      }
      if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, data: prod });
    }

    const prod = fallbackStore.products.find(p => p._id === idOrSlug || p.slug === idOrSlug);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, data: prod });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const {
      title, modelCode, slug, category, categorySlug, regularPrice, salePrice,
      images, badge, inStock, stockCount, shortDesc, description, features, specs,
      isDeal, isFeatured, isCatEarSpecial
    } = req.body;

    if (!title || !regularPrice || !salePrice) {
      return res.status(400).json({ success: false, message: 'Title, Regular Price, and Sale Price are required' });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const calculatedDiscount = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;
    const catSlug = categorySlug || (category ? category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'general');

    if (getMongoStatus()) {
      const newProd = await Product.create({
        title,
        modelCode: modelCode || '',
        slug: generatedSlug,
        category: category || 'Gaming Peripherals',
        categorySlug: catSlug,
        regularPrice: Number(regularPrice),
        salePrice: Number(salePrice),
        discountPercentage: calculatedDiscount,
        images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
        badge: badge || '',
        inStock: inStock !== undefined ? inStock : true,
        stockCount: stockCount ? Number(stockCount) : 15,
        rating: 4.8,
        reviewCount: 1,
        shortDesc: shortDesc || '',
        description: description || shortDesc || '',
        features: features || [],
        specs: specs || {},
        isDeal: !!isDeal,
        isFeatured: !!isFeatured,
        isCatEarSpecial: !!isCatEarSpecial
      });
      return res.status(201).json({ success: true, data: newProd });
    }

    const newProd = {
      _id: 'prod_' + Date.now(),
      title,
      modelCode: modelCode || '',
      slug: generatedSlug,
      category: category || 'Gaming Peripherals',
      categorySlug: catSlug,
      regularPrice: Number(regularPrice),
      salePrice: Number(salePrice),
      discountPercentage: calculatedDiscount,
      images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
      badge: badge || '',
      inStock: inStock !== undefined ? inStock : true,
      stockCount: stockCount ? Number(stockCount) : 15,
      rating: 4.8,
      reviewCount: 1,
      shortDesc: shortDesc || '',
      description: description || shortDesc || '',
      features: features || [],
      specs: specs || {},
      isDeal: !!isDeal,
      isFeatured: !!isFeatured,
      isCatEarSpecial: !!isCatEarSpecial,
      createdAt: new Date()
    };
    fallbackStore.products.unshift(newProd);
    return res.status(201).json({ success: true, data: newProd });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.images && Array.isArray(updateData.images)) {
      const cleaned = updateData.images.filter(img => typeof img === 'string' && img.trim().length > 0).slice(0, 5);
      if (cleaned.length > 0) {
        updateData.images = cleaned;
      }
    }

    if (updateData.regularPrice !== undefined) updateData.regularPrice = Number(updateData.regularPrice);
    if (updateData.salePrice !== undefined) updateData.salePrice = Number(updateData.salePrice);

    if (updateData.regularPrice && updateData.salePrice) {
      updateData.discountPercentage = updateData.regularPrice > updateData.salePrice
        ? Math.round(((updateData.regularPrice - updateData.salePrice) / updateData.regularPrice) * 100)
        : 0;
    }

    if (getMongoStatus()) {
      const updated = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, data: updated });
    }

    const idx = fallbackStore.products.findIndex(p => p._id === id || p.slug === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });
    fallbackStore.products[idx] = {
      ...fallbackStore.products[idx],
      ...updateData
    };
    return res.json({ success: true, data: fallbackStore.products[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update product stock quantity & status
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stockCount, inStock } = req.body;

    const update = {};
    if (stockCount !== undefined) {
      update.stockCount = Math.max(0, Number(stockCount));
      // Automatically toggle inStock to false if count reaches 0, true if > 0 unless explicitly specified
      if (inStock === undefined) {
        update.inStock = update.stockCount > 0;
      }
    }
    if (inStock !== undefined) {
      update.inStock = Boolean(inStock);
    }

    if (getMongoStatus()) {
      const updated = await Product.findByIdAndUpdate(id, { $set: update }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, data: updated });
    }

    const idx = fallbackStore.products.findIndex(p => p._id === id || p.slug === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });
    fallbackStore.products[idx] = {
      ...fallbackStore.products[idx],
      ...update
    };
    return res.json({ success: true, data: fallbackStore.products[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getMongoStatus()) {
      const deleted = await Product.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, message: 'Product deleted successfully' });
    }

    const idx = fallbackStore.products.findIndex(p => p._id === id || p.slug === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });
    fallbackStore.products.splice(idx, 1);
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
