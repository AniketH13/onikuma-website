// Admin Dashboard Operations Module for Onikuma Nepal
import {
  fetchCategories, createCategory, deleteCategory,
  fetchProducts, createProduct, updateProduct, deleteProduct, updateProductStock,
  fetchOrders, updateOrderStatus,
  fetchSettings, updateSettings,
  fetchAnalytics,
  checkHealth, loginAdmin, verifyAdminSession,
  uploadImage, uploadImages
} from './api.js';

const ADMIN_TOKEN_KEY = 'onikuma_admin_token';

let categories = [];
let products = [];
let orders = [];
let settings = {};
let formsInitialized = false;

// Product Photo Uploads State (Stores data URLs or existing URLs)
let addProdPhotos = [];
let editProdPhotos = [];

export async function initAdmin() {
  setupTabs();
  setupAuth();

  // Check existing session
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    const check = await verifyAdminSession(token);
    if (check.valid && check.user) {
      await unlockDashboard(check.user.username);
      return;
    }
  }

  // Show login screen if not authenticated
  lockDashboard();
}

function lockDashboard() {
  const overlay = document.getElementById('adminLoginOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

async function unlockDashboard(username = 'admin') {
  const overlay = document.getElementById('adminLoginOverlay');
  const usernameBadge = document.getElementById('adminUsernameBadge');
  if (overlay) overlay.classList.add('hidden');
  if (usernameBadge) usernameBadge.textContent = username;

  await loadDBStatus();
  await refreshDashboard();
  await refreshCategories();
  await refreshProducts();
  await refreshOrders();
  await refreshOffers();
  await refreshSettings();
  startOrderPolling();

  if (!formsInitialized) {
    setupForms();
    formsInitialized = true;
  }
}

function setupAuth() {
  const loginForm = document.getElementById('adminLoginForm');
  const loginInput = document.getElementById('loginUsername');
  const pwdInput = document.getElementById('loginPassword');
  const togglePwdBtn = document.getElementById('btnTogglePwd');
  const quickFillBtn = document.getElementById('btnQuickFillCreds');
  const alertBox = document.getElementById('loginAlertBox');
  const alertMsg = document.getElementById('loginAlertMsg');
  const logoutBtn = document.getElementById('btnAdminLogout');
  const submitBtn = document.getElementById('btnAdminLoginSubmit');

  // Toggle password visibility
  if (togglePwdBtn && pwdInput) {
    togglePwdBtn.addEventListener('click', () => {
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        togglePwdBtn.textContent = '🙈';
      } else {
        pwdInput.type = 'password';
        togglePwdBtn.textContent = '👁️';
      }
    });
  }

  // Quick fill default credentials
  if (quickFillBtn && loginInput && pwdInput) {
    quickFillBtn.addEventListener('click', () => {
      loginInput.value = 'admin';
      pwdInput.value = 'onikuma2026';
      if (alertBox) alertBox.classList.remove('active');
    });
  }

  // Handle Login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = loginInput.value.trim();
      const password = pwdInput.value;

      if (!username || !password) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }
      if (alertBox) alertBox.classList.remove('active');

      const res = await loginAdmin(username, password);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Admin Console →';
      }

      if (res.success && res.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
        showAdminToast('Welcome back, Admin!');
        await unlockDashboard(res.user?.username || username);
      } else {
        if (alertBox && alertMsg) {
          alertMsg.textContent = res.message || 'Invalid Admin ID or Password';
          alertBox.classList.add('active');
        }
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out of the Admin Console?')) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        lockDashboard();
        if (alertBox) alertBox.classList.remove('active');
        if (pwdInput) pwdInput.value = '';
        showAdminToast('Signed out successfully');
      }
    });
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.admin-nav-btn');
  const panes = document.querySelectorAll('.admin-tab-pane');
  const pageTitle = document.getElementById('adminPageTitle');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');

      const tabTitleMap = {
        dashboardTab: 'Dashboard Overview',
        salesTab: 'Sales Report',
        categoriesTab: 'Category Management',
        productsTab: 'Product Management',
        ordersTab: 'Orders & Fulfillment',
        offersTab: 'Special Offers & Promotions',
        bannersTab: 'Banner Management',
        settingsTab: 'Store Settings'
      };
      if (pageTitle) {
        pageTitle.textContent = tabTitleMap[tabId] || 'Admin Console';
      }

      // Lazy-load data when switching to Sales tab
      if (tabId === 'salesTab') refreshSales();
      if (tabId === 'dashboardTab') refreshDashboard();
    });
  });
}

async function loadDBStatus() {
  const statusPill = document.getElementById('adminDbStatus');
  const health = await checkHealth();

  if (statusPill) {
    if (health.mongoConnected) {
      statusPill.innerHTML = `<span class="db-dot"></span> MongoDB Connected (Live)`;
    } else {
      statusPill.innerHTML = `<span class="db-dot fallback"></span> In-Memory Fallback Active`;
    }
  }
}

// ---------------- CATEGORY MANAGEMENT ---------------- //
export async function refreshCategories() {
  categories = await fetchCategories();
  renderCategoriesTable();
  populateCategorySelects();
}

function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No categories created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = categories.map((cat, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <span style="font-size: 1.2rem; margin-right: 8px;">${cat.icon || '📁'}</span>
        <strong>${cat.name}</strong>
      </td>
      <td><code style="color: var(--color-cyan);">${cat.slug}</code></td>
      <td style="color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${cat.description || '—'}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon-action delete btn-del-cat" data-id="${cat._id}" title="Delete Category">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-del-cat').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this category? It will also be removed from the storefront navigation dropdown.')) {
        const res = await deleteCategory(id);
        if (res.success) {
          showAdminToast('Category deleted successfully');
          await refreshCategories();
        } else {
          alert('Could not delete category: ' + res.message);
        }
      }
    });
  });
}

function populateCategorySelects() {
  const selects = document.querySelectorAll('.category-dropdown-select');
  selects.forEach(select => {
    select.innerHTML = categories.map(c => `<option value="${c.name}" data-slug="${c.slug}">${c.name}</option>`).join('');
  });
}

// ---------------- PRODUCT MANAGEMENT ---------------- //
export async function refreshProducts() {
  products = await fetchProducts();
  renderProductsTable();
  renderStockTable();
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No products created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map((prod, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${prod.images && prod.images[0] ? prod.images[0] : ''}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: contain; background: #0E1217;">
          <div>
            <strong>${prod.title}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${prod.modelCode || '—'}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-sale" style="font-size: 0.7rem;">${prod.category}</span></td>
      <td>
        <strong style="color: var(--color-primary);">Rs. ${(prod.salePrice || prod.regularPrice).toLocaleString()}</strong>
        ${prod.regularPrice > prod.salePrice ? `<div style="font-size: 0.75rem; text-decoration: line-through; color: var(--text-muted);">Rs. ${prod.regularPrice.toLocaleString()}</div>` : ''}
      </td>
      <td>
        <span class="badge ${prod.inStock ? 'badge-stock' : 'badge-hot'}">
          ${prod.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon-action edit btn-edit-prod" data-id="${prod._id}" title="Edit Product">✏️</button>
          <button class="btn-icon-action delete btn-del-prod" data-id="${prod._id}" title="Delete Product">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Edit product button
  tbody.querySelectorAll('.btn-edit-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = products.find(p => p._id === id);
      if (!prod) return;
      openEditProductModal(prod);
    });
  });

  tbody.querySelectorAll('.btn-del-prod').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this product from catalog?')) {
        const res = await deleteProduct(id);
        if (res.success) {
          showAdminToast('Product deleted successfully');
          await refreshProducts();
        } else {
          alert('Could not delete product: ' + res.message);
        }
      }
    });
  });
}

// Photo Upload & Preview Utilities
function renderPhotoPreviews(containerId, photosList, isEdit = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (photosList.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-muted); border-radius: 4px;">No photos selected yet. Click the box above or drag images to upload from your computer.</div>`;
    return;
  }

  container.innerHTML = photosList.map((url, idx) => `
    <div class="photo-preview-item ${idx === 0 ? 'is-cover' : ''}">
      <img src="${url}" alt="Photo ${idx + 1}">
      ${idx === 0 ? '<span class="photo-preview-badge">COVER</span>' : ''}
      <button type="button" class="btn-remove-photo" data-idx="${idx}" title="Remove photo">✕</button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-remove-photo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-idx'));
      if (isEdit) {
        editProdPhotos.splice(idx, 1);
        renderPhotoPreviews('editProdPreviewGrid', editProdPhotos, true);
        syncUrlInputs('editProdImage', editProdPhotos);
      } else {
        addProdPhotos.splice(idx, 1);
        renderPhotoPreviews('addProdPreviewGrid', addProdPhotos, false);
        syncUrlInputs('addProdImage', addProdPhotos);
      }
    });
  });
}

function syncUrlInputs(prefix, photosList) {
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`${prefix}${i}`);
    if (input) input.value = photosList[i - 1] || '';
  }
}

function setupDropzone(dropzoneId, fileInputId, previewContainerId, urlPrefix, isEdit) {
  const dropzone = document.getElementById(dropzoneId);
  const fileInput = document.getElementById(fileInputId);
  if (!dropzone || !fileInput) return;

  // Click to trigger hidden file input
  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFiles(fileInput.files);
      fileInput.value = '';
    }
  });

  function handleFiles(files) {
    const currentList = isEdit ? editProdPhotos : addProdPhotos;
    const remainingSlots = 5 - currentList.length;
    if (remainingSlots <= 0) {
      alert('Maximum 5 photos allowed per product. Please remove an existing photo first.');
      return;
    }

    const fileArr = Array.from(files).slice(0, remainingSlots);
    fileArr.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not an image file.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        if (isEdit) {
          if (editProdPhotos.length < 5) editProdPhotos.push(dataUrl);
          renderPhotoPreviews(previewContainerId, editProdPhotos, true);
          syncUrlInputs(urlPrefix, editProdPhotos);
        } else {
          if (addProdPhotos.length < 5) addProdPhotos.push(dataUrl);
          renderPhotoPreviews(previewContainerId, addProdPhotos, false);
          syncUrlInputs(urlPrefix, addProdPhotos);
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

async function resolveUploadedImages(photosList, urlPrefix) {
  const finalUrls = [];
  const uploadPayload = [];

  // Check manual URL inputs if photosList is empty
  if (photosList.length === 0) {
    for (let i = 1; i <= 5; i++) {
      const val = document.getElementById(`${urlPrefix}${i}`)?.value.trim();
      if (val) photosList.push(val);
    }
  }

  for (let i = 0; i < photosList.length; i++) {
    const item = photosList[i];
    if (typeof item === 'string' && item.startsWith('data:image')) {
      uploadPayload.push({ image: item, filename: `photo-${Date.now()}-${i + 1}.jpg` });
    } else if (typeof item === 'string' && item.trim()) {
      finalUrls.push(item.trim());
    }
  }

  if (uploadPayload.length > 0) {
    const res = await uploadImages(uploadPayload);
    if (res.success && Array.isArray(res.urls)) {
      finalUrls.push(...res.urls);
    } else {
      console.error('Failed to upload photos:', res.message);
      alert('Warning: Some photos could not be saved to disk: ' + (res.message || ''));
    }
  }

  return finalUrls.slice(0, 5);
}

function openEditProductModal(prod) {
  const modal = document.getElementById('editProductModal');
  if (!modal) return;

  document.getElementById('editProdId').value = prod._id;
  document.getElementById('editProdTitle').value = prod.title || '';
  document.getElementById('editProdModelCode').value = prod.modelCode || '';
  document.getElementById('editProdSalePrice').value = prod.salePrice || prod.regularPrice || 0;
  document.getElementById('editProdRegularPrice').value = prod.regularPrice || '';
  document.getElementById('editProdIsDeal').checked = Boolean(prod.isDeal);
  document.getElementById('editProdBadge').value = prod.badge || '';
  document.getElementById('editProdIsCatEar').checked = Boolean(prod.isCatEarSpecial);
  document.getElementById('editProdDesc').value = prod.description || prod.shortDesc || '';

  const catSelect = document.getElementById('editProdCategory');
  if (catSelect) catSelect.value = prod.category;

  // Technical Specifications
  const s = prod.specs || {};
  const setElVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  setElVal('editProdSpecDriver', s.driver);
  setElVal('editProdSpecConnectivity', s.connectivity);
  setElVal('editProdSpecLighting', s.lighting);
  setElVal('editProdSpecMic', s.microphone);
  setElVal('editProdSpecCompat', s.compatibility);
  setElVal('editProdSpecCable', s.cableLength);
  setElVal('editProdSpecWeight', s.weight);

  // Key Features (one per line)
  const feats = Array.isArray(prod.features) ? prod.features : [];
  setElVal('editProdFeatures', feats.join('\n'));

  // Photos
  editProdPhotos = Array.isArray(prod.images) ? [...prod.images] : [];
  renderPhotoPreviews('editProdPreviewGrid', editProdPhotos, true);
  syncUrlInputs('editProdImage', editProdPhotos);

  modal.classList.add('active');
}

// ---------------- OFFERS & DEALS MANAGEMENT ---------------- //
export async function refreshOffers() {
  settings = await fetchSettings();
  renderPromoCodes();
  renderDealsTable();

  const announcementInput = document.getElementById('dealAnnouncementText');
  const freeThresholdInput = document.getElementById('dealFreeDeliveryThreshold');
  if (announcementInput) announcementInput.value = settings.announcement || '';
  if (freeThresholdInput) freeThresholdInput.value = settings.freeDeliveryThreshold || 3000;
}

export function renderPromoCodes() {
  const container = document.getElementById('promoCodesList');
  if (!container) return;

  const codes = settings.promoCodes || [];
  if (codes.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 12px;">No active promo codes. Click "+ Add Promo Code" to create one.</div>`;
    return;
  }

  container.innerHTML = codes.map((pc, idx) => `
    <div class="promo-code-card">
      <div class="promo-code-top">
        <span class="promo-code-badge">${pc.code}</span>
        <span class="promo-code-discount">${pc.discountPercent}% OFF</span>
      </div>
      <div class="promo-code-meta">
        Min. Spend: <strong>Rs. ${(pc.minSpend || 0).toLocaleString()}</strong>
      </div>
      <button type="button" class="btn-del-promo" data-index="${idx}" title="Delete Code">
        🗑️ Delete Code
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-del-promo').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const codeItem = codes[idx];
      if (!codeItem) return;
      if (confirm(`Delete promo code "${codeItem.code}"?`)) {
        const updated = codes.filter((_, i) => i !== idx);
        const res = await updateSettings({ promoCodes: updated });
        if (res.success) {
          settings.promoCodes = updated;
          showAdminToast('Promo code removed!');
          renderPromoCodes();
        } else {
          alert('Could not delete promo code: ' + res.message);
        }
      }
    });
  });
}

export function renderDealsTable() {
  const tbody = document.getElementById('offersDealsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(prod => {
    const reg = prod.regularPrice || prod.salePrice || 0;
    const sale = prod.salePrice || prod.regularPrice || 0;
    const discount = reg > sale ? Math.round(((reg - sale) / reg) * 100) : 0;

    return `
      <tr data-id="${prod._id}">
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${prod.images && prod.images[0] ? prod.images[0] : ''}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px; background: #0E1217;">
            <div>
              <strong>${prod.title}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${prod.modelCode || '—'}</div>
            </div>
          </div>
        </td>
        <td>
          <input type="number" class="form-control deal-reg-price" data-id="${prod._id}" value="${reg}" style="width: 90px; padding: 4px; font-size: 0.8rem;">
        </td>
        <td>
          <input type="number" class="form-control deal-sale-price" data-id="${prod._id}" value="${sale}" style="width: 90px; padding: 4px; font-size: 0.8rem; font-weight: 700; color: var(--color-primary);">
        </td>
        <td>
          <span class="badge badge-sale">${discount > 0 ? `-${discount}%` : '0%'}</span>
        </td>
        <td>
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" class="deal-is-deal-check" data-id="${prod._id}" ${prod.isDeal ? 'checked' : ''}>
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--color-amber);">Deal</span>
          </label>
        </td>
        <td>
          <select class="form-control deal-badge-select" data-id="${prod._id}" style="font-size: 0.78rem; padding: 4px;">
            <option value="" ${!prod.badge ? 'selected' : ''}>None</option>
            <option value="Sale" ${prod.badge === 'Sale' ? 'selected' : ''}>Sale</option>
            <option value="Hot" ${prod.badge === 'Hot' ? 'selected' : ''}>Hot Deal</option>
            <option value="Best Seller" ${prod.badge === 'Best Seller' ? 'selected' : ''}>Best Seller</option>
            <option value="New" ${prod.badge === 'New' ? 'selected' : ''}>New Arrival</option>
            <option value="Cat-Ear" ${prod.badge === 'Cat-Ear' ? 'selected' : ''}>Cat-Ear</option>
          </select>
        </td>
        <td>
          <button type="button" class="btn btn-primary btn-save-deal" data-id="${prod._id}" style="padding: 4px 10px; font-size: 0.75rem;">
            Save
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-save-deal').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const row = tbody.querySelector(`tr[data-id="${id}"]`);
      if (!row) return;

      const regularPrice = Number(row.querySelector('.deal-reg-price')?.value) || 0;
      const salePrice = Number(row.querySelector('.deal-sale-price')?.value) || regularPrice;
      const isDeal = Boolean(row.querySelector('.deal-is-deal-check')?.checked);
      const badge = row.querySelector('.deal-badge-select')?.value || '';

      btn.disabled = true;
      btn.textContent = 'Saving...';
      const res = await updateProduct(id, { regularPrice, salePrice, isDeal, badge });
      btn.disabled = false;
      btn.textContent = 'Save';

      if (res.success) {
        showAdminToast('Deal offer updated!');
        await refreshProducts();
        renderDealsTable();
      } else {
        alert('Could not update offer: ' + res.message);
      }
    });
  });
}

// ---------------- REAL-TIME ORDER ALERT & SOUND ---------------- //
function playOrderAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn('Audio alert not playable:', e);
  }
}

let orderPollInterval = null;
let knownOrderIds = new Set();
let isInitialOrdersLoad = true;

function startOrderPolling() {
  if (orderPollInterval) clearInterval(orderPollInterval);

  orders.forEach(o => knownOrderIds.add(o._id));

  orderPollInterval = setInterval(async () => {
    try {
      const latestOrders = await fetchOrders();
      if (!Array.isArray(latestOrders)) return;

      const newOrders = latestOrders.filter(o => !knownOrderIds.has(o._id));
      if (newOrders.length > 0 && !isInitialOrdersLoad) {
        const newest = newOrders[0];
        showOrderReceivedAlert(newest);
        playOrderAlertSound();
      }

      latestOrders.forEach(o => knownOrderIds.add(o._id));
      isInitialOrdersLoad = false;

      if (latestOrders.length !== orders.length) {
        orders = latestOrders;
        renderOrdersTable();
        refreshDashboard();
      }
    } catch (e) {
      console.warn('Order polling error:', e);
    }
  }, 6000);
}

function showOrderReceivedAlert(order) {
  const banner = document.getElementById('adminOrderAlertBanner');
  const desc = document.getElementById('adminOrderAlertText');
  if (!banner) return;

  if (desc) {
    const cust = order.customer ? order.customer.fullName : 'Customer';
    desc.textContent = `Order ${order.orderNumber} received from ${cust} (Rs. ${(order.total || 0).toLocaleString()}) - ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD'}`;
  }
  banner.classList.remove('hidden');
}

// ---------------- STOCK & INVENTORY MANAGEMENT ---------------- //
export function renderStockTable(filterQuery = '') {
  const tbody = document.getElementById('stockTableBody');
  if (!tbody) return;

  calculateStockStats();

  let list = [...products];
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    list = list.filter(p => p.title.toLowerCase().includes(q) || (p.modelCode && p.modelCode.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No matching inventory found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((prod, i) => {
    const count = prod.stockCount !== undefined ? prod.stockCount : 15;
    const isOut = count <= 0 || !prod.inStock;
    const isLow = count > 0 && count <= 5;
    const statusLabel = isOut ? 'Out of Stock' : (isLow ? `Low Stock (${count} left)` : `In Stock (${count})`);
    const statusClass = isOut ? 'badge-hot' : (isLow ? 'status-pending' : 'badge-stock');

    return `
      <tr data-id="${prod._id}">
        <td>${i + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${prod.images && prod.images[0] ? prod.images[0] : ''}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: contain; background: #0E1217;">
            <div>
              <strong>${prod.title}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${prod.modelCode || '—'}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-sale" style="font-size: 0.7rem;">${prod.category}</span></td>
        <td><strong style="color: var(--color-primary);">Rs. ${(prod.salePrice || prod.regularPrice).toLocaleString()}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn-icon-action btn-stock-minus" data-id="${prod._id}" style="width: 28px; height: 28px; font-weight: 800;">-</button>
            <input type="number" class="stock-qty-input" data-id="${prod._id}" value="${count}" min="0" max="999" style="width: 60px; text-align: center; padding: 4px; font-weight: 700;">
            <button type="button" class="btn-icon-action btn-stock-plus" data-id="${prod._id}" style="width: 28px; height: 28px; font-weight: 800;">+</button>
          </div>
        </td>
        <td>
          <span class="badge ${statusClass}">
            ${statusLabel}
          </span>
        </td>
        <td>
          <button type="button" class="btn btn-primary btn-save-stock" data-id="${prod._id}" style="padding: 6px 12px; font-size: 0.78rem;">
            Save
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Minus button
  tbody.querySelectorAll('.btn-stock-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const input = tbody.querySelector(`.stock-qty-input[data-id="${id}"]`);
      if (input) {
        let val = Math.max(0, parseInt(input.value, 10) - 1);
        input.value = val;
      }
    });
  });

  // Plus button
  tbody.querySelectorAll('.btn-stock-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const input = tbody.querySelector(`.stock-qty-input[data-id="${id}"]`);
      if (input) {
        let val = parseInt(input.value, 10) + 1;
        input.value = val;
      }
    });
  });

  // Save button
  tbody.querySelectorAll('.btn-save-stock').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const input = tbody.querySelector(`.stock-qty-input[data-id="${id}"]`);
      if (!input) return;
      const count = Math.max(0, parseInt(input.value, 10) || 0);

      btn.disabled = true;
      btn.textContent = 'Saving...';
      const res = await updateProductStock(id, { stockCount: count, inStock: count > 0 });
      btn.disabled = false;
      btn.textContent = 'Save';

      if (res.success) {
        showAdminToast(`Stock updated to ${count} units`);
        const prod = products.find(p => p._id === id);
        if (prod) {
          prod.stockCount = count;
          prod.inStock = count > 0;
        }
        calculateStockStats();
        renderStockTable(document.getElementById('stockSearchInput')?.value || '');
        renderProductsTable();
      } else {
        alert('Could not update stock: ' + res.message);
      }
    });
  });
}

function calculateStockStats() {
  const statSkus = document.getElementById('statTotalSkus');
  const statUnits = document.getElementById('statTotalUnits');
  const statLow = document.getElementById('statLowStock');
  const statOut = document.getElementById('statOutOfStock');

  const totalSkus = products.length;
  const totalUnits = products.reduce((sum, p) => sum + (p.stockCount !== undefined ? p.stockCount : 15), 0);
  const lowStock = products.filter(p => {
    const c = p.stockCount !== undefined ? p.stockCount : 15;
    return c > 0 && c <= 5;
  }).length;
  const outOfStock = products.filter(p => {
    const c = p.stockCount !== undefined ? p.stockCount : 15;
    return c <= 0 || !p.inStock;
  }).length;

  if (statSkus) statSkus.textContent = totalSkus;
  if (statUnits) statUnits.textContent = totalUnits;
  if (statLow) statLow.textContent = lowStock;
  if (statOut) statOut.textContent = outOfStock;
}

// ---------------- ORDER MANAGEMENT ---------------- //
export async function refreshOrders() {
  orders = await fetchOrders();
  renderOrdersTable();
}

function renderOrderStatusControl(order) {
  if (order.status === 'Cancelled') {
    return `<span class="badge status-cancelled" style="font-size: 0.78rem; padding: 6px 10px;">❌ Cancelled (Final)</span>`;
  }
  if (order.status === 'Returned') {
    return `<span class="badge status-returned" style="font-size: 0.78rem; padding: 6px 10px;">↩️ Returned (Final)</span>`;
  }
  if (order.status === 'Delivered') {
    return `
      <select class="order-status-select status-change-select" data-id="${order._id}" style="border-color: rgba(6, 214, 160, 0.4); color: var(--color-emerald); font-weight: 700;">
        <option value="Delivered" selected>🎉 Delivered</option>
        <option value="Returned">↩️ Return Order</option>
      </select>
    `;
  }
  return `
    <select class="order-status-select status-change-select" data-id="${order._id}">
      <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
      <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>✅ Confirmed</option>
      <option value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>🚚 Dispatched</option>
      <option value="Delivered">🎉 Delivered</option>
      <option value="Cancelled">❌ Cancelled</option>
    </select>
  `;
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  const countBadge = document.getElementById('orderCountBadge');
  if (countBadge) countBadge.textContent = orders.length;
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No orders recorded yet. Checkout orders will appear here in real time.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>
        <strong style="color: var(--color-cyan); font-family: var(--font-mono);">${order.orderNumber}</strong>
        <div style="font-size: 0.72rem; color: var(--text-muted);">${new Date(order.createdAt).toLocaleDateString()}</div>
      </td>
      <td>
        <strong>${order.customer ? order.customer.fullName : 'Guest'}</strong>
        <div style="font-size: 0.78rem; color: var(--text-secondary);">📞 ${order.customer ? order.customer.phone : ''}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${order.customer ? order.customer.address + ', ' + order.customer.city : ''}</div>
      </td>
      <td>
        <div style="font-size: 0.82rem;">
          ${(order.items || []).map(item => `${item.title} (x${item.quantity})`).join('<br>')}
        </div>
      </td>
      <td>
        <strong style="color: var(--color-primary); font-size: 0.95rem;">Rs. ${order.total.toLocaleString()}</strong>
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted);">${order.paymentMethod || 'COD'}</div>
      </td>
      <td>
        ${renderOrderStatusControl(order)}
      </td>
      <td>
        <a href="https://wa.me/977${order.customer ? order.customer.phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(`Hi ${order.customer ? order.customer.fullName : ''}, this is Onikuma Nepal regarding your order ${order.orderNumber}. Status is: ${order.status}`)}" target="_blank" class="btn btn-whatsapp" style="padding: 4px 10px; font-size: 0.76rem;">
          💬 WhatsApp
        </a>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.status-change-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = sel.getAttribute('data-id');
      const newStatus = e.target.value;

      if (newStatus === 'Returned') {
        const conf = confirm('Are you sure you want to mark this delivered order as RETURNED? The items will be returned to inventory stock.');
        if (!conf) {
          renderOrdersTable();
          return;
        }
      } else if (newStatus === 'Cancelled') {
        const conf = confirm('Are you sure you want to CANCEL this order? Cancelled orders cannot be modified again.');
        if (!conf) {
          renderOrdersTable();
          return;
        }
      }

      const res = await updateOrderStatus(id, newStatus);
      if (res.success) {
        showAdminToast(`Order ${res.data.orderNumber} set to ${newStatus}`);
        const found = orders.find(o => o._id === id);
        if (found) {
          found.status = newStatus;
          found.stockDeducted = res.data.stockDeducted;
        }
        await refreshProducts();
        renderOrdersTable();
        refreshDashboard();
      } else {
        alert('Could not update status: ' + res.message);
        renderOrdersTable();
      }
    });
  });
}

// ---------------- SETTINGS MANAGEMENT ---------------- //
export async function refreshSettings() {
  settings = await fetchSettings();
  const hotlineInput = document.getElementById('settingHotline');
  const whatsappInput = document.getElementById('settingWhatsapp');
  const bannerInput = document.getElementById('settingAnnouncement');
  const insideFeeInput = document.getElementById('settingInsideValleyFee');
  const outsideFeeInput = document.getElementById('settingOutsideValleyFee');
  const flashDealEndInput = document.getElementById('settingFlashDealEnd');

  if (hotlineInput) hotlineInput.value = settings.hotline || '9864006883';
  if (whatsappInput) whatsappInput.value = settings.whatsapp || '9864006883';
  if (bannerInput) bannerInput.value = settings.announcement || '';
  if (insideFeeInput) insideFeeInput.value = settings.insideValleyDeliveryFee || 100;
  if (outsideFeeInput) outsideFeeInput.value = settings.outsideValleyDeliveryFee || 200;

  if (flashDealEndInput && settings.flashDealEndDate) {
    // Convert stored ISO string to local datetime-local format (YYYY-MM-DDTHH:MM)
    const dt = new Date(settings.flashDealEndDate);
    if (!isNaN(dt)) {
      const pad = n => String(n).padStart(2, '0');
      flashDealEndInput.value = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    }
  }
}

function setupForms() {
  // Category Form Modal
  const openCatModalBtn = document.getElementById('btnOpenAddCategory');
  const catModal = document.getElementById('addCategoryModal');
  const closeCatModalBtn = document.getElementById('closeAddCategoryModal');
  const categoryForm = document.getElementById('categoryCreateForm');

  if (openCatModalBtn && catModal) {
    openCatModalBtn.addEventListener('click', () => catModal.classList.add('active'));
  }
  if (closeCatModalBtn && catModal) {
    closeCatModalBtn.addEventListener('click', () => catModal.classList.remove('active'));
  }

  if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = categoryForm.catName.value.trim();
      const slug = categoryForm.catSlug.value.trim();
      const icon = categoryForm.catIcon.value.trim() || '🎮';
      const description = categoryForm.catDesc.value.trim();

      if (!name) return alert('Category Name is required.');

      const res = await createCategory({ name, slug, icon, description });
      if (res.success) {
        showAdminToast(`Category "${name}" created! Dropdown updated.`);
        catModal.classList.remove('active');
        categoryForm.reset();
        await refreshCategories();
      } else {
        alert('Error: ' + res.message);
      }
    });
  }

  // Real-Time Alert Banner Listeners
  const alertCloseBtn = document.getElementById('btnAlertClose');
  const alertViewBtn = document.getElementById('btnAlertViewOrder');
  const alertBanner = document.getElementById('adminOrderAlertBanner');

  if (alertCloseBtn && alertBanner) {
    alertCloseBtn.addEventListener('click', () => alertBanner.classList.add('hidden'));
  }
  if (alertViewBtn && alertBanner) {
    alertViewBtn.addEventListener('click', () => {
      alertBanner.classList.add('hidden');
      const ordersNavBtn = document.querySelector('.admin-nav-btn[data-tab="ordersTab"]');
      if (ordersNavBtn) ordersNavBtn.click();
    });
  }

  // Edit Product Modal Listeners
  const editProdModal = document.getElementById('editProductModal');
  const closeEditProdModalBtn = document.getElementById('closeEditProductModal');
  const editProdForm = document.getElementById('productEditForm');

  if (closeEditProdModalBtn && editProdModal) {
    closeEditProdModalBtn.addEventListener('click', () => editProdModal.classList.remove('active'));
  }

  if (editProdForm) {
    editProdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitEditProduct');
      const originalText = submitBtn ? submitBtn.textContent : 'Save Product Changes';

      try {
        const id = document.getElementById('editProdId').value;
        const title = document.getElementById('editProdTitle').value.trim();
        const modelCode = document.getElementById('editProdModelCode').value.trim();
        const category = document.getElementById('editProdCategory').value;
        const salePrice = Number(document.getElementById('editProdSalePrice').value);
        const regularPrice = Number(document.getElementById('editProdRegularPrice').value) || salePrice;
        const isDeal = document.getElementById('editProdIsDeal').checked;
        const badge = document.getElementById('editProdBadge').value;
        const isCatEar = document.getElementById('editProdIsCatEar').checked;
        const shortDesc = document.getElementById('editProdDesc').value.trim();

        if (!title || !salePrice) return alert('Title and Sale Price are required');

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '⏳ Uploading photos & saving...';
        }

        // Upload any newly selected local images
        const images = await resolveUploadedImages(editProdPhotos, 'editProdImage');

        // Gather Technical Specifications
        const specs = {
          driver: document.getElementById('editProdSpecDriver')?.value.trim() || undefined,
          connectivity: document.getElementById('editProdSpecConnectivity')?.value.trim() || undefined,
          lighting: document.getElementById('editProdSpecLighting')?.value.trim() || undefined,
          microphone: document.getElementById('editProdSpecMic')?.value.trim() || undefined,
          compatibility: document.getElementById('editProdSpecCompat')?.value.trim() || undefined,
          cableLength: document.getElementById('editProdSpecCable')?.value.trim() || undefined,
          weight: document.getElementById('editProdSpecWeight')?.value.trim() || undefined
        };

        // Gather Key Features
        const rawFeatures = document.getElementById('editProdFeatures')?.value.trim() || '';
        const features = rawFeatures
          ? rawFeatures.split('\n').map(f => f.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
          : [];

        const catObj = categories.find(c => c.name === category);
        const categorySlug = catObj ? catObj.slug : category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const res = await updateProduct(id, {
          title,
          modelCode,
          category,
          categorySlug,
          salePrice,
          regularPrice,
          isDeal,
          badge,
          isCatEarSpecial: isCatEar,
          shortDesc,
          specs,
          features,
          images: images.length > 0 ? images : undefined
        });

        if (res.success) {
          showAdminToast(`Product "${title}" updated successfully!`);
          editProdModal.classList.remove('active');
          await refreshProducts();
          renderDealsTable();
        } else {
          alert('Error updating product: ' + res.message);
        }
      } catch (err) {
        console.error('Error in product edit:', err);
        alert('An error occurred: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Promo Code Modal & Form Listeners
  const openPromoModalBtn = document.getElementById('btnOpenAddPromoCode');
  const promoModal = document.getElementById('addPromoCodeModal');
  const closePromoModalBtn = document.getElementById('closeAddPromoCodeModal');
  const promoForm = document.getElementById('promoCodeCreateForm');

  if (openPromoModalBtn && promoModal) {
    openPromoModalBtn.addEventListener('click', () => promoModal.classList.add('active'));
  }
  if (closePromoModalBtn && promoModal) {
    closePromoModalBtn.addEventListener('click', () => promoModal.classList.remove('active'));
  }
  if (promoForm) {
    promoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('promoCodeInput').value.trim().toUpperCase();
      const discountPercent = Number(document.getElementById('promoDiscountInput').value);
      const minSpend = Number(document.getElementById('promoMinSpendInput').value) || 0;

      if (!code || !discountPercent) return alert('Code and Discount % are required');

      const currentCodes = settings.promoCodes || [];
      const updated = [...currentCodes.filter(c => c.code !== code), { code, discountPercent, minSpend }];

      const res = await updateSettings({ promoCodes: updated });
      if (res.success) {
        settings.promoCodes = updated;
        showAdminToast(`Promo code "${code}" added!`);
        promoModal.classList.remove('active');
        promoForm.reset();
        renderPromoCodes();
      } else {
        alert('Could not save promo code: ' + res.message);
      }
    });
  }

  // Deal Banner Form Listeners
  const dealBannerForm = document.getElementById('dealBannerForm');
  if (dealBannerForm) {
    dealBannerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const announcement = document.getElementById('dealAnnouncementText').value.trim();
      const freeDeliveryThreshold = Number(document.getElementById('dealFreeDeliveryThreshold').value) || 3000;

      const res = await updateSettings({ announcement, freeDeliveryThreshold });
      if (res.success) {
        settings.announcement = announcement;
        settings.freeDeliveryThreshold = freeDeliveryThreshold;
        showAdminToast('Deal banner and delivery threshold saved!');
      } else {
        alert('Could not save deal settings: ' + res.message);
      }
    });
  }

  // Product Form Modal (With photo upload dropzone and technical specs)
  const openProdModalBtn = document.getElementById('btnOpenAddProduct');
  const prodModal = document.getElementById('addProductModal');
  const closeProdModalBtn = document.getElementById('closeAddProductModal');
  const productForm = document.getElementById('productCreateForm');

  // Initialize photo dropzones
  setupDropzone('addProdDropzone', 'addProdFileInput', 'addProdPreviewGrid', 'addProdImage', false);
  setupDropzone('editProdDropzone', 'editProdFileInput', 'editProdPreviewGrid', 'editProdImage', true);

  if (openProdModalBtn && prodModal) {
    openProdModalBtn.addEventListener('click', () => {
      addProdPhotos = [];
      renderPhotoPreviews('addProdPreviewGrid', addProdPhotos, false);
      syncUrlInputs('addProdImage', addProdPhotos);
      prodModal.classList.add('active');
    });
  }
  if (closeProdModalBtn && prodModal) {
    closeProdModalBtn.addEventListener('click', () => prodModal.classList.remove('active'));
  }

  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitAddProduct');
      const originalText = submitBtn ? submitBtn.textContent : 'Save & Publish Product to Store';

      try {
        const title = productForm.prodTitle.value.trim();
        const modelCode = productForm.prodModelCode.value.trim();
        const category = productForm.prodCategory.value;
        const salePrice = Number(productForm.prodSalePrice.value);
        const regularPrice = Number(productForm.prodRegularPrice.value) || salePrice;
        const shortDesc = productForm.prodDesc.value.trim();
        const badge = productForm.prodBadge.value;
        const isCatEar = productForm.prodIsCatEar ? productForm.prodIsCatEar.checked : false;

        if (!title || !salePrice) return alert('Title and Sale Price are required');

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '⏳ Uploading photos & publishing...';
        }

        // Upload any newly selected local images
        const images = await resolveUploadedImages(addProdPhotos, 'addProdImage');

        // Gather Technical Specifications
        const specs = {
          driver: document.getElementById('addProdSpecDriver')?.value.trim() || undefined,
          connectivity: document.getElementById('addProdSpecConnectivity')?.value.trim() || undefined,
          lighting: document.getElementById('addProdSpecLighting')?.value.trim() || undefined,
          microphone: document.getElementById('addProdSpecMic')?.value.trim() || undefined,
          compatibility: document.getElementById('addProdSpecCompat')?.value.trim() || undefined,
          cableLength: document.getElementById('addProdSpecCable')?.value.trim() || undefined,
          weight: document.getElementById('addProdSpecWeight')?.value.trim() || undefined
        };

        // Gather Key Features
        const rawFeatures = document.getElementById('addProdFeatures')?.value.trim() || '';
        const features = rawFeatures
          ? rawFeatures.split('\n').map(f => f.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
          : [];

        const catObj = categories.find(c => c.name === category);
        const categorySlug = catObj ? catObj.slug : category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const res = await createProduct({
          title,
          modelCode,
          category,
          categorySlug,
          salePrice,
          regularPrice,
          images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'],
          shortDesc,
          badge,
          isCatEarSpecial: isCatEar,
          specs,
          features,
          inStock: true
        });

        if (res.success) {
          showAdminToast(`Product "${title}" added to store!`);
          prodModal.classList.remove('active');
          productForm.reset();
          addProdPhotos = [];
          renderPhotoPreviews('addProdPreviewGrid', addProdPhotos, false);
          await refreshProducts();
          renderDealsTable();
        } else {
          alert('Error adding product: ' + res.message);
        }
      } catch (err) {
        console.error('Error adding product:', err);
        alert('An error occurred: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Settings Save Form
  const settingsForm = document.getElementById('storeSettingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const flashDealEndRaw = document.getElementById('settingFlashDealEnd').value;
      const updates = {
        hotline: document.getElementById('settingHotline').value.trim(),
        whatsapp: document.getElementById('settingWhatsapp').value.trim(),
        announcement: document.getElementById('settingAnnouncement').value.trim(),
        insideValleyDeliveryFee: Number(document.getElementById('settingInsideValleyFee').value),
        outsideValleyDeliveryFee: Number(document.getElementById('settingOutsideValleyFee').value),
        flashDealEndDate: flashDealEndRaw ? new Date(flashDealEndRaw).toISOString() : null
      };

      const res = await updateSettings(updates);
      if (res.success) {
        showAdminToast('Store settings saved successfully!');
      } else {
        alert('Could not update settings: ' + res.message);
      }
    });
  }

  // Stock Search Filter
  const stockSearchInput = document.getElementById('stockSearchInput');
  if (stockSearchInput) {
    stockSearchInput.addEventListener('input', (e) => {
      renderStockTable(e.target.value.trim());
    });
  }
}

function showAdminToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-success show';
  toast.innerHTML = `<span>✓</span> <div>${msg}</div>`;
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.zIndex = '99999';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ---------------- DASHBOARD ---------------- //
export async function refreshDashboard() {
  const data = await fetchAnalytics();
  if (!data) return;

  const fmt = n => 'Rs. ' + (n || 0).toLocaleString('en-IN');

  // Stat cards
  const el = id => document.getElementById(id);
  if (el('dashTotalProducts'))   el('dashTotalProducts').textContent   = data.summary.totalProducts || 0;
  if (el('dashTotalRevenue'))    el('dashTotalRevenue').textContent    = fmt(data.summary.totalRevenue);
  if (el('dashTotalOrders'))     el('dashTotalOrders').textContent     = data.summary.totalOrders || 0;
  if (el('dashUniqueCustomers')) el('dashUniqueCustomers').textContent = data.summary.uniqueCustomers || 0;

  // Status breakdown
  const statusList = el('dashStatusList');
  if (statusList) {
    const statusColors = {
      Pending: '#f59e0b', Confirmed: '#6366f1', Processing: '#3b82f6',
      Dispatched: '#8b5cf6', Delivered: '#10b981', Cancelled: '#ef4444', Returned: '#64748b'
    };
    const breakdown = data.statusBreakdown || {};
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
    statusList.innerHTML = Object.entries(breakdown).map(([status, count]) => {
      const pct = Math.round((count / total) * 100);
      const color = statusColors[status] || '#888';
      return `
        <div class="dash-status-row">
          <div class="dash-status-meta">
            <span class="dash-status-dot" style="background:${color};"></span>
            <span class="dash-status-name">${status}</span>
            <span class="dash-status-count">${count}</span>
          </div>
          <div class="dash-status-bar-wrap">
            <div class="dash-status-bar" style="width:${pct}%;background:${color};"></div>
          </div>
        </div>`;
    }).join('');
  }

  // Top products
  const topProdsEl = el('dashTopProducts');
  if (topProdsEl) {
    const topProds = data.topProducts || [];
    if (topProds.length === 0) {
      topProdsEl.innerHTML = `<div class="dash-loading">No delivered orders yet.</div>`;
    } else {
      topProdsEl.innerHTML = topProds.map((p, i) => `
        <div class="dash-top-prod-row">
          <span class="dash-top-prod-rank">#${i + 1}</span>
          <div class="dash-top-prod-info">
            <span class="dash-top-prod-title">${p.title}</span>
            <span class="dash-top-prod-meta">${p.qty} units sold</span>
          </div>
          <span class="dash-top-prod-rev">Rs. ${(p.revenue || 0).toLocaleString('en-IN')}</span>
        </div>`).join('');
    }
  }

  // Recent orders
  renderRecentOrders(data.recentOrders || []);

  // Wire "View All Orders" button
  const viewAllBtn = el('dashViewAllOrders');
  if (viewAllBtn && !viewAllBtn._wired) {
    viewAllBtn._wired = true;
    viewAllBtn.addEventListener('click', () => {
      const ordersBtn = document.querySelector('.admin-nav-btn[data-tab="ordersTab"]');
      if (ordersBtn) ordersBtn.click();
    });
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('dashRecentOrdersBody');
  if (!tbody) return;

  const statusColors = {
    Pending: '#f59e0b', Confirmed: '#6366f1', Processing: '#3b82f6',
    Dispatched: '#8b5cf6', Delivered: '#10b981', Cancelled: '#ef4444', Returned: '#64748b'
  };

  const slice = orders.slice(0, 10);
  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No orders yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = slice.map(o => {
    const date = new Date(o.createdAt).toLocaleDateString('en-NP', { day:'2-digit', month:'short', year:'numeric' });
    const color = statusColors[o.status] || '#888';
    return `<tr>
      <td><code style="font-size:0.78rem;color:var(--color-primary);">${o.orderNumber}</code></td>
      <td>${o.customer?.fullName || '—'}</td>
      <td>${o.customer?.phone || '—'}</td>
      <td><strong>Rs. ${(o.total || 0).toLocaleString('en-IN')}</strong></td>
      <td><span class="badge" style="background:${color}22;color:${color};border:1px solid ${color}44;padding:3px 8px;border-radius:999px;font-size:0.75rem;">${o.status}</span></td>
      <td style="font-size:0.8rem;color:var(--text-secondary);">${date}</td>
    </tr>`;
  }).join('');
}

// ---------------- SALES REPORT ---------------- //
let lastSalesData = null;

export async function refreshSales(params = {}) {
  const data = await fetchAnalytics(params);
  if (!data) return;
  lastSalesData = data;

  const el = id => document.getElementById(id);
  const fmt = n => 'Rs. ' + (n || 0).toLocaleString('en-IN');

  // Filtered summary
  if (el('salesFilteredOrders')) el('salesFilteredOrders').textContent = data.summary.filteredOrders;
  if (el('salesFilteredRevenue')) el('salesFilteredRevenue').textContent = fmt(data.summary.filteredRevenue);

  // Daily sales table
  const tbody = el('salesByDateBody');
  if (tbody) {
    const rows = data.salesByDate || [];
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No data for selected range.</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(r => `<tr>
        <td><strong>${r.date}</strong></td>
        <td>${r.orders}</td>
        <td><strong>Rs. ${(r.revenue || 0).toLocaleString('en-IN')}</strong></td>
        <td><span style="color:#10b981;">${r.delivered}</span></td>
        <td><span style="color:#f59e0b;">${r.pending}</span></td>
        <td><span style="color:#ef4444;">${r.cancelled}</span></td>
      </tr>`).join('');
    }
  }

  // Individual orders table
  const ordersTbody = el('salesOrdersBody');
  if (ordersTbody) {
    const orders = data.recentOrders || [];
    const statusColors = {
      Pending: '#f59e0b', Confirmed: '#6366f1', Processing: '#3b82f6',
      Dispatched: '#8b5cf6', Delivered: '#10b981', Cancelled: '#ef4444', Returned: '#64748b'
    };
    const payLabels = { cod: 'Cash on Delivery', esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay', whatsapp: 'WhatsApp' };
    if (orders.length === 0) {
      ordersTbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">No orders for selected range.</td></tr>`;
    } else {
      ordersTbody.innerHTML = orders.map(o => {
        const itemSummary = (o.items || []).map(i => `${i.title} ×${i.quantity}`).join(', ');
        const date = new Date(o.createdAt).toLocaleDateString('en-NP', { day:'2-digit', month:'short', year:'numeric' });
        const color = statusColors[o.status] || '#888';
        return `<tr>
          <td><code style="font-size:0.78rem;color:var(--color-primary);">${o.orderNumber}</code></td>
          <td>${o.customer?.fullName || '—'}</td>
          <td>${o.customer?.phone || '—'}</td>
          <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${itemSummary}">${itemSummary}</td>
          <td><strong>Rs. ${(o.total || 0).toLocaleString('en-IN')}</strong></td>
          <td style="font-size:0.78rem;">${payLabels[o.paymentMethod] || o.paymentMethod}</td>
          <td><span class="badge" style="background:${color}22;color:${color};border:1px solid ${color}44;padding:3px 8px;border-radius:999px;font-size:0.75rem;">${o.status}</span></td>
          <td style="font-size:0.8rem;color:var(--text-secondary);">${date}</td>
        </tr>`;
      }).join('');
    }
  }

  // Wire filter buttons (only once)
  setupSalesFilters();
}

let salesFiltersWired = false;
function setupSalesFilters() {
  if (salesFiltersWired) return;
  salesFiltersWired = true;

  const applyBtn = document.getElementById('btnApplySalesFilter');
  const clearBtn = document.getElementById('btnClearSalesFilter');
  const exportBtn = document.getElementById('btnExportSalesCSV');

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const from = document.getElementById('salesFromDate')?.value;
      const to   = document.getElementById('salesToDate')?.value;
      refreshSales({ from, to });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const fromInput = document.getElementById('salesFromDate');
      const toInput   = document.getElementById('salesToDate');
      if (fromInput) fromInput.value = '';
      if (toInput)   toInput.value   = '';
      refreshSales();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportSalesCSV);
  }
}

function exportSalesCSV() {
  if (!lastSalesData) return;
  const rows = lastSalesData.salesByDate || [];
  if (rows.length === 0) { alert('No data to export.'); return; }

  const header = ['Date', 'Orders', 'Revenue (NPR)', 'Delivered', 'Pending', 'Cancelled'];
  const csvRows = [header.join(','), ...rows.map(r =>
    [r.date, r.orders, r.revenue, r.delivered, r.pending, r.cancelled].join(',')
  )];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `onikuma-sales-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
