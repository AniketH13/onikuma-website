// API Client for Onikuma Nepal REST Endpoints
const API_BASE = '/api';

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

export async function fetchProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.badge) query.set('badge', params.badge);
    if (params.deal) query.set('deal', 'true');
    if (params.featured) query.set('featured', 'true');
    if (params.catear) query.set('catear', 'true');
    if (params.limit) query.set('limit', params.limit);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

export async function fetchProductById(idOrSlug) {
  try {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Error fetching product details:', err);
    return null;
  }
}

export async function createOrder(orderData) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  } catch (err) {
    console.error('Error creating order:', err);
    return { success: false, message: err.message };
  }
}

export async function fetchOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (err) {
    console.error('Error updating order status:', err);
    return { success: false, message: err.message };
  }
}

export async function fetchSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return data.success ? data.data : {};
  } catch (err) {
    console.error('Error fetching settings:', err);
    return {};
  }
}

export async function updateSettings(settings) {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return await res.json();
  } catch (err) {
    console.error('Error updating settings:', err);
    return { success: false, message: err.message };
  }
}

export async function createCategory(catData) {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catData)
    });
    return await res.json();
  } catch (err) {
    console.error('Error creating category:', err);
    return { success: false, message: err.message };
  }
}

export async function deleteCategory(id) {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.error('Error deleting category:', err);
    return { success: false, message: err.message };
  }
}

export async function createProduct(prodData) {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });
    return await res.json();
  } catch (err) {
    console.error('Error creating product:', err);
    return { success: false, message: err.message };
  }
}

export async function updateProduct(id, prodData) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });
    return await res.json();
  } catch (err) {
    console.error('Error updating product:', err);
    return { success: false, message: err.message };
  }
}

export async function updateProductStock(id, stockData) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockData)
    });
    return await res.json();
  } catch (err) {
    console.error('Error updating product stock:', err);
    return { success: false, message: err.message };
  }
}

export async function deleteProduct(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.error('Error deleting product:', err);
    return { success: false, message: err.message };
  }
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', mongoConnected: false };
  }
}

export async function loginAdmin(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await res.json();
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, message: err.message };
  }
}

export async function verifyAdminSession(token) {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    return { success: false, valid: false };
  }
}

export async function uploadImage(dataUri, filename = 'photo.jpg') {
  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUri, filename })
    });
    return await res.json();
  } catch (err) {
    console.error('Upload image error:', err);
    return { success: false, message: err.message };
  }
}

export async function uploadImages(imagesArray) {
  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: imagesArray })
    });
    return await res.json();
  } catch (err) {
    console.error('Upload images error:', err);
    return { success: false, message: err.message };
  }
}



export async function fetchAnalytics(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to)   query.set('to',   params.to);
    const res = await fetch(`${API_BASE}/analytics?${query.toString()}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return null;
  }
}
