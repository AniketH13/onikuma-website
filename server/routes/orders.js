import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { getMongoStatus, fallbackStore } from '../db/connect.js';

const router = express.Router();

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper to adjust product stock count and inStock status when an order is delivered or reverted.
 * Supports multi-tier resolution: ObjectId, slug, exact title, case-insensitive title,
 * fuzzy title keywords, and modelCode.
 * @param {Object} order The order object containing items
 * @param {boolean} deduct If true, decreases stock; if false, restores stock
 */
async function adjustStockForOrder(order, deduct = true) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) return;

  if (getMongoStatus()) {
    for (const item of order.items) {
      const qty = Number(item.quantity) || 1;
      let prod = null;
      const pIdStr = item.productId ? String(item.productId).trim() : '';
      const titleClean = item.title ? String(item.title).trim() : '';

      // 1. Try productId if valid ObjectId
      if (pIdStr && pIdStr.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          prod = await Product.findById(pIdStr);
        } catch (e) {
          prod = null;
        }
      }
      // 2. Try slug lookup
      if (!prod && pIdStr) {
        prod = await Product.findOne({ slug: pIdStr });
      }
      // 3. Fallback to product title match (exact)
      if (!prod && titleClean) {
        prod = await Product.findOne({ title: titleClean });
      }
      // 4. Case-insensitive exact title match
      if (!prod && titleClean) {
        prod = await Product.findOne({ title: new RegExp('^' + escapeRegex(titleClean) + '$', 'i') });
      }
      // 5. Title keyword / partial match
      if (!prod && titleClean) {
        const words = titleClean.split(/\s+/).filter(w => w.length >= 2);
        if (words.length > 0) {
          const regexStr = words.map(escapeRegex).join('.*');
          prod = await Product.findOne({ title: new RegExp(regexStr, 'i') });
        }
      }
      // 6. Model code match
      if (!prod) {
        const searchTerms = `${pIdStr} ${titleClean}`.toLowerCase();
        const allProds = await Product.find().lean();
        const matched = allProds.find(p => p.modelCode && searchTerms.includes(p.modelCode.toLowerCase()));
        if (matched) {
          prod = await Product.findById(matched._id);
        }
      }

      if (prod) {
        const currentStock = prod.stockCount !== undefined ? Number(prod.stockCount) : 15;
        const newStock = deduct ? Math.max(0, currentStock - qty) : currentStock + qty;
        prod.stockCount = newStock;
        prod.inStock = newStock > 0;
        await prod.save();
        console.log(`[MongoDB Stock Adjusted] "${prod.title}": ${currentStock} -> ${newStock} (${deduct ? '-' : '+'}${qty})`);
      } else {
        console.warn(`[MongoDB Stock Adjustment Warning] Product not found for order item:`, item);
      }
    }
  } else {
    // Resilient fallback in-memory store
    for (const item of order.items) {
      const qty = Number(item.quantity) || 1;
      const pIdStr = item.productId ? String(item.productId).trim() : '';
      const titleLower = item.title ? String(item.title).trim().toLowerCase() : '';

      const prod = fallbackStore.products.find(p => {
        if (pIdStr && (p._id === pIdStr || p.slug === pIdStr)) return true;
        const pTitle = p.title.trim().toLowerCase();
        if (titleLower && pTitle === titleLower) return true;
        if (titleLower && (pTitle.includes(titleLower) || titleLower.includes(pTitle))) return true;
        if (p.modelCode && (titleLower.includes(p.modelCode.toLowerCase()) || pIdStr.toLowerCase().includes(p.modelCode.toLowerCase()))) return true;
        return false;
      });

      if (prod) {
        const currentStock = prod.stockCount !== undefined ? Number(prod.stockCount) : 15;
        const newStock = deduct ? Math.max(0, currentStock - qty) : currentStock + qty;
        prod.stockCount = newStock;
        prod.inStock = newStock > 0;
        console.log(`[Fallback Stock Adjusted] "${prod.title}": ${currentStock} -> ${newStock} (${deduct ? '-' : '+'}${qty})`);
      } else {
        console.warn(`[Fallback Stock Adjustment Warning] Product not found for order item:`, item);
      }
    }
  }
}

// GET all orders (for Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    if (getMongoStatus()) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, data: orders });
    }
    return res.json({ success: true, count: fallbackStore.orders.length, data: fallbackStore.orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create customer order from Checkout
router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, deliveryFee, discount, total, paymentMethod } = req.body;

    if (!customer || !customer.fullName || !customer.phone || !customer.address || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Customer details and cart items are required' });
    }

    // Server-side inventory limit validation
    for (const item of items) {
      const requestedQty = Number(item.quantity) || 1;
      let prod = null;
      if (getMongoStatus()) {
        if (item.productId && typeof item.productId === 'string' && item.productId.match(/^[0-9a-fA-F]{24}$/)) {
          prod = await Product.findById(item.productId);
        }
        if (!prod && item.productId) {
          prod = await Product.findOne({ slug: item.productId });
        }
        if (!prod && item.title) {
          prod = await Product.findOne({ title: item.title });
        }
      } else {
        prod = fallbackStore.products.find(p =>
          (item.productId && (p._id === item.productId || p.slug === item.productId)) ||
          (item.title && p.title.trim().toLowerCase() === item.title.trim().toLowerCase())
        );
      }

      if (prod) {
        const availableStock = prod.stockCount !== undefined ? Number(prod.stockCount) : 15;
        if (requestedQty > availableStock) {
          return res.status(400).json({
            success: false,
            message: `Cannot place order: Only ${availableStock} units available in stock for "${prod.title}". Please reduce your cart quantity.`
          });
        }
      }
    }

    const orderNumber = 'ONK-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

    const orderPayload = {
      orderNumber,
      customer: {
        ...customer,
        city: customer.city || customer.district || 'Kathmandu'
      },
      items,
      subtotal: Number(subtotal),
      deliveryFee: Number(deliveryFee || 0),
      discount: Number(discount || 0),
      total: Number(total),
      paymentMethod: paymentMethod || 'cod',
      status: 'Pending',
      stockDeducted: false,
      createdAt: new Date()
    };

    if (getMongoStatus()) {
      const created = await Order.create(orderPayload);
      return res.status(201).json({ success: true, data: created });
    }

    const created = {
      _id: 'ord_' + Date.now(),
      ...orderPayload
    };
    fallbackStore.orders.unshift(created);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Delivered', 'Cancelled', 'Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    if (getMongoStatus()) {
      let order = null;
      if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(id);
      }
      if (!order && id) {
        order = await Order.findOne({ orderNumber: id });
      }
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      // Rules:
      // 1. Cancelled orders cannot be changed
      if (order.status === 'Cancelled' && status !== 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Cancelled orders cannot be modified.' });
      }

      // 2. Returned orders cannot be changed
      if (order.status === 'Returned' && status !== 'Returned') {
        return res.status(400).json({ success: false, message: 'Returned orders cannot be modified.' });
      }

      // 3. Delivered orders can ONLY transition to Returned
      if (order.status === 'Delivered') {
        if (status !== 'Delivered' && status !== 'Returned') {
          return res.status(400).json({
            success: false,
            message: 'After an order is Delivered, the only allowed status update is Return.'
          });
        }
      } else if (status === 'Returned') {
        return res.status(400).json({
          success: false,
          message: 'An order must be Delivered before it can be Returned.'
        });
      }

      const wasDeducted = Boolean(order.stockDeducted);

      // When marking Delivered: deduct stock
      if (status === 'Delivered' && !wasDeducted) {
        await adjustStockForOrder(order, true);
        order.stockDeducted = true;
      }
      // When marking Returned from Delivered: restore stock back to inventory
      else if (status === 'Returned' && wasDeducted) {
        await adjustStockForOrder(order, false);
        order.stockDeducted = false;
      }

      order.status = status;
      await order.save();
      return res.json({ success: true, data: order });
    }

    const order = fallbackStore.orders.find(o => o._id === id || o.orderNumber === id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Rules:
    // 1. Cancelled orders cannot be changed
    if (order.status === 'Cancelled' && status !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled orders cannot be modified.' });
    }

    // 2. Returned orders cannot be changed
    if (order.status === 'Returned' && status !== 'Returned') {
      return res.status(400).json({ success: false, message: 'Returned orders cannot be modified.' });
    }

    // 3. Delivered orders can ONLY transition to Returned
    if (order.status === 'Delivered') {
      if (status !== 'Delivered' && status !== 'Returned') {
        return res.status(400).json({
          success: false,
          message: 'After an order is Delivered, the only allowed status update is Return.'
        });
      }
    } else if (status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'An order must be Delivered before it can be Returned.'
      });
    }

    const wasDeducted = Boolean(order.stockDeducted);

    if (status === 'Delivered' && !wasDeducted) {
      await adjustStockForOrder(order, true);
      order.stockDeducted = true;
    } else if (status === 'Returned' && wasDeducted) {
      await adjustStockForOrder(order, false);
      order.stockDeducted = false;
    }

    order.status = status;
    return res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
