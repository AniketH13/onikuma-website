import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { getMongoStatus, fallbackStore } from '../db/connect.js';

const router = express.Router();

/**
 * Count unique customers: matched by phone number and full name.
 * If either the phone or the name is different, consider it as a unique customer.
 * Only orders sharing both the exact phone AND name belong to the same customer.
 */
function countUniqueCustomers(orders) {
  const customerKeys = new Set();

  orders.forEach(order => {
    const phone = (order.customer && order.customer.phone ? String(order.customer.phone) : '').replace(/\s+/g, '').toLowerCase();
    const name  = (order.customer && order.customer.fullName ? String(order.customer.fullName) : '').trim().toLowerCase();

    // If both are missing, skip or treat individual order as unassigned
    if (!phone && !name) {
      if (order._id) customerKeys.add(`anon_${order._id}`);
      return;
    }

    const key = `${phone}:::${name}`;
    customerKeys.add(key);
  });

  return customerKeys.size;
}

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;

    let allOrders = [];
    let totalProducts = 0;

    if (getMongoStatus()) {
      allOrders = await Order.find().sort({ createdAt: -1 }).lean();
      totalProducts = await Product.countDocuments();
    } else {
      allOrders = fallbackStore.orders;
      totalProducts = fallbackStore.products.length;
    }

    let filtered = allOrders;
    const fromDate = from ? new Date(from) : null;
    const toDate   = to   ? new Date(to + 'T23:59:59') : null;
    if (fromDate || toDate) {
      filtered = allOrders.filter(o => {
        const d = new Date(o.createdAt);
        if (fromDate && d < fromDate) return false;
        if (toDate   && d > toDate)   return false;
        return true;
      });
    }

    const deliveredAll = allOrders.filter(o => o.status === 'Delivered');
    const totalRevenue = deliveredAll.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders  = allOrders.length;
    const uniqueCustomers = countUniqueCustomers(allOrders);

    const salesOrders = filtered;
    const filteredRevenue = salesOrders
      .filter(o => o.status !== 'Cancelled' && o.status !== 'Returned')
      .reduce((s, o) => s + (o.total || 0), 0);

    const byDate = {};
    salesOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, orders: 0, revenue: 0, delivered: 0, cancelled: 0, pending: 0 };
      }
      byDate[dateKey].orders++;
      if (order.status !== 'Cancelled' && order.status !== 'Returned') {
        byDate[dateKey].revenue += order.total || 0;
      }
      if (order.status === 'Delivered') byDate[dateKey].delivered++;
      if (order.status === 'Cancelled') byDate[dateKey].cancelled++;
      if (['Pending','Confirmed','Processing','Dispatched'].includes(order.status)) byDate[dateKey].pending++;
    });
    const salesByDate = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

    const statusBreakdown = {};
    ['Pending','Confirmed','Processing','Dispatched','Delivered','Cancelled','Returned'].forEach(s => {
      statusBreakdown[s] = salesOrders.filter(o => o.status === s).length;
    });

    const productSales = {};
    deliveredAll.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.title || 'Unknown';
        if (!productSales[key]) productSales[key] = { title: key, qty: 0, revenue: 0 };
        productSales[key].qty += item.quantity || 1;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalOrders,
          totalRevenue,
          uniqueCustomers,
          filteredRevenue,
          filteredOrders: salesOrders.length
        },
        statusBreakdown,
        salesByDate,
        topProducts,
        recentOrders: salesOrders.slice(0, 20)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
