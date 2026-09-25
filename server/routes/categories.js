import express from 'express';
import Category from '../models/Category.js';
import { getMongoStatus, fallbackStore } from '../db/connect.js';

const router = express.Router();

// GET all categories (sorted by order)
router.get('/', async (req, res) => {
  try {
    if (getMongoStatus()) {
      const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
      return res.json({ success: true, data: categories });
    }
    return res.json({ success: true, data: fallbackStore.categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single category by slug or id
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    if (getMongoStatus()) {
      let cat = null;
      if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        cat = await Category.findById(idOrSlug);
      }
      if (!cat) {
        cat = await Category.findOne({ slug: idOrSlug });
      }
      if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
      return res.json({ success: true, data: cat });
    }
    const cat = fallbackStore.categories.find(c => c._id === idOrSlug || c.slug === idOrSlug);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    return res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  try {
    const { name, slug, icon, parent, description, order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (getMongoStatus()) {
      const existing = await Category.findOne({ slug: generatedSlug });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category with this slug already exists' });
      }
      const newCat = await Category.create({
        name,
        slug: generatedSlug,
        icon: icon || '🎮',
        parent: parent || null,
        description: description || '',
        order: order ? Number(order) : 0
      });
      return res.status(201).json({ success: true, data: newCat });
    }

    const newCat = {
      _id: 'cat_' + Date.now(),
      name,
      slug: generatedSlug,
      icon: icon || '🎮',
      parent: parent || null,
      description: description || '',
      order: order ? Number(order) : 0,
      createdAt: new Date()
    };
    fallbackStore.categories.push(newCat);
    return res.status(201).json({ success: true, data: newCat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, parent, description, order, isActive } = req.body;

    if (getMongoStatus()) {
      const updated = await Category.findByIdAndUpdate(
        id,
        { $set: { name, slug, icon, parent, description, order, isActive } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Category not found' });
      return res.json({ success: true, data: updated });
    }

    const idx = fallbackStore.categories.findIndex(c => c._id === id || c.slug === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Category not found' });
    fallbackStore.categories[idx] = {
      ...fallbackStore.categories[idx],
      name: name ?? fallbackStore.categories[idx].name,
      slug: slug ?? fallbackStore.categories[idx].slug,
      icon: icon ?? fallbackStore.categories[idx].icon,
      parent: parent ?? fallbackStore.categories[idx].parent,
      description: description ?? fallbackStore.categories[idx].description,
      order: order !== undefined ? Number(order) : fallbackStore.categories[idx].order,
      isActive: isActive !== undefined ? isActive : fallbackStore.categories[idx].isActive
    };
    return res.json({ success: true, data: fallbackStore.categories[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST bulk delete categories
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No category IDs provided' });
    }

    if (getMongoStatus()) {
      const mongoose = (await import('mongoose')).default;
      const validObjectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
      const orConditions = [{ slug: { $in: ids } }];
      if (validObjectIds.length > 0) {
        orConditions.push({ _id: { $in: validObjectIds } });
      }

      const result = await Category.deleteMany({ $or: orConditions });
      return res.json({
        success: true,
        message: `Successfully deleted ${result.deletedCount || ids.length} category/categories`,
        deletedCount: result.deletedCount
      });
    }

    const initialLength = fallbackStore.categories.length;
    fallbackStore.categories = fallbackStore.categories.filter(c => !ids.includes(c._id) && !ids.includes(c.slug));
    const deletedCount = initialLength - fallbackStore.categories.length;
    return res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} category/categories`,
      deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getMongoStatus()) {
      let deleted = null;
      if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
        deleted = await Category.findByIdAndDelete(id);
      }
      if (!deleted && id) {
        deleted = await Category.findOneAndDelete({ slug: id });
      }
      if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });
      return res.json({ success: true, message: 'Category deleted successfully' });
    }

    const idx = fallbackStore.categories.findIndex(c => c._id === id || c.slug === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Category not found' });
    fallbackStore.categories.splice(idx, 1);
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
