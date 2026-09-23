// Products Catalog Controller with Comprehensive Category Filtering
import { fetchCategories, fetchProducts, fetchSettings } from './api.js';
import { initCart, addToCart, openCartDrawer, syncCartStock } from './cart.js';
import { initSearch } from './search.js';
import { initQuickView, openQuickView } from './quickview.js';
import { initCheckout } from './checkout.js';
import { initTrackOrder } from './track-order.js';

let allProducts = [];
let allCategories = [];
let currentCategory = 'all';
let currentPriceFilter = 'all';
let inStockOnly = false;
let dealsOnly = false;
let currentSort = 'featured';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
  initCart();
  initSearch();
  initQuickView();
  initCheckout();
  initTrackOrder();

  await loadStoreSettings();

  // Read URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('category')) {
    currentCategory = urlParams.get('category');
  }
  if (urlParams.has('deal') && urlParams.get('deal') === 'true') {
    dealsOnly = true;
  }
  if (urlParams.has('search')) {
    currentSearch = urlParams.get('search');
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) searchInput.value = currentSearch;
  }

  await loadCategories();
  await loadCatalogProducts();
  setupFilterEventListeners();
});

async function loadStoreSettings() {
  const settings = await fetchSettings();
  const hotlineEls = document.querySelectorAll('.hotline-text');
  const whatsappEls = document.querySelectorAll('.whatsapp-number-text');
  const announcementEl = document.getElementById('topbarAnnouncement');

  if (settings.hotline) hotlineEls.forEach(el => el.textContent = settings.hotline);
  if (settings.whatsapp) whatsappEls.forEach(el => el.textContent = settings.whatsapp);
  if (settings.announcement && announcementEl) announcementEl.textContent = settings.announcement;
}

async function loadCategories() {
  allCategories = await fetchCategories();
  renderCategoryDropdownMenu();
  renderCategorySidebarFilter();
}

function renderCategoryDropdownMenu() {
  const dropdownMenu = document.getElementById('categoryDropdownMenu');
  if (!dropdownMenu) return;

  dropdownMenu.innerHTML = allCategories.map(cat => `
    <div class="category-menu-item" data-slug="${cat.slug}">
      <div class="category-item-left">
        <span class="category-item-icon">${cat.icon || '🎧'}</span>
        <span>${cat.name}</span>
      </div>
      <span class="category-item-badge">Browse</span>
    </div>
  `).join('');

  dropdownMenu.querySelectorAll('.category-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const slug = item.getAttribute('data-slug');
      setCategoryFilter(slug);
      toggleCategoryDropdown(false);
    });
  });
}

function renderCategorySidebarFilter() {
  const container = document.getElementById('sidebarCategoryList');
  if (!container) return;

  let html = `
    <div class="filter-category-item ${currentCategory === 'all' ? 'active' : ''}" data-slug="all">
      <div class="filter-cat-left">
        <span>🔥</span>
        <span>All Products</span>
      </div>
      <span class="filter-cat-count" id="countCatAll">${allProducts.length}</span>
    </div>
  `;

  html += allCategories.map(cat => {
    const count = allProducts.filter(p => p.categorySlug === cat.slug || p.category === cat.name).length;
    return `
      <div class="filter-category-item ${currentCategory === cat.slug ? 'active' : ''}" data-slug="${cat.slug}">
        <div class="filter-cat-left">
          <span>${cat.icon || '🎮'}</span>
          <span>${cat.name}</span>
        </div>
        <span class="filter-cat-count">${count}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = html;

  container.querySelectorAll('.filter-category-item').forEach(el => {
    el.addEventListener('click', () => {
      const slug = el.getAttribute('data-slug');
      setCategoryFilter(slug);
    });
  });
}

function updateCategoryCounts() {
  const allCountEl = document.getElementById('countCatAll');
  if (allCountEl) allCountEl.textContent = allProducts.length;

  const container = document.getElementById('sidebarCategoryList');
  if (container) {
    container.querySelectorAll('.filter-category-item').forEach(el => {
      const slug = el.getAttribute('data-slug');
      const countEl = el.querySelector('.filter-cat-count');
      if (slug === 'all') {
        if (countEl) countEl.textContent = allProducts.length;
      } else {
        const count = allProducts.filter(p => p.categorySlug === slug || p.category === slug).length;
        if (countEl) countEl.textContent = count;
      }
    });
  }
}

async function loadCatalogProducts() {
  allProducts = await fetchProducts();
  syncCartStock(allProducts);
  updateCategoryCounts();
  applyFiltersAndRender();
}

function setCategoryFilter(slug) {
  currentCategory = slug;

  // Update active state in sidebar
  const items = document.querySelectorAll('.filter-category-item');
  items.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-slug') === slug);
  });

  // Update Breadcrumb & Heading
  const breadcrumbCategory = document.getElementById('breadcrumbCategory');
  const pageTitle = document.getElementById('catalogPageTitle');
  const catObj = allCategories.find(c => c.slug === slug);

  if (slug === 'all') {
    if (breadcrumbCategory) breadcrumbCategory.textContent = 'All Products';
    if (pageTitle) pageTitle.innerHTML = 'All <span>ONIKUMA</span> Gear';
  } else if (catObj) {
    if (breadcrumbCategory) breadcrumbCategory.textContent = catObj.name;
    if (pageTitle) pageTitle.innerHTML = `${catObj.name} <span>Collection</span>`;
  }

  // Update URL history without reload
  const url = new URL(window.location);
  if (slug === 'all') {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', slug);
  }
  window.history.pushState({}, '', url);

  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  let filtered = [...allProducts];

  // 1. Category Filter
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p =>
      p.categorySlug === currentCategory ||
      (p.category && p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === currentCategory)
    );
  }

  // 2. In Stock Filter
  if (inStockOnly) {
    filtered = filtered.filter(p => (p.stockCount !== undefined ? p.stockCount > 0 : p.inStock));
  }

  // 3. Deals Only Filter
  if (dealsOnly) {
    filtered = filtered.filter(p => p.isDeal || (p.regularPrice && p.regularPrice > p.salePrice));
  }

  // 4. Price Tier Filter
  if (currentPriceFilter === 'under2500') {
    filtered = filtered.filter(p => (p.salePrice || p.regularPrice) < 2500);
  } else if (currentPriceFilter === '2500-4000') {
    filtered = filtered.filter(p => {
      const price = p.salePrice || p.regularPrice;
      return price >= 2500 && price <= 4000;
    });
  } else if (currentPriceFilter === 'above4000') {
    filtered = filtered.filter(p => (p.salePrice || p.regularPrice) > 4000);
  }

  // 5. Search Filter
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.modelCode && p.modelCode.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  // 6. Sorting
  if (currentSort === 'price-low') {
    filtered.sort((a, b) => (a.salePrice || a.regularPrice) - (b.salePrice || b.regularPrice));
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => (b.salePrice || b.regularPrice) - (a.salePrice || a.regularPrice));
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => (b.rating || 5) - (a.rating || 5));
  } else if (currentSort === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  renderResults(filtered);
  renderActivePills(filtered.length);
}

function renderResults(products) {
  const container = document.getElementById('catalogProductsGrid');
  const countDisplay = document.getElementById('catalogResultCount');
  if (countDisplay) {
    countDisplay.textContent = products.length;
  }

  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="catalog-empty-box">
        <div class="catalog-empty-icon">🎮</div>
        <div class="catalog-empty-title">No Matching Products Found</div>
        <div class="catalog-empty-desc">Try clearing or adjusting your category, price, or stock filters to see more official Onikuma gear.</div>
        <button class="btn btn-primary" id="btnEmptyResetFilters">Reset All Filters</button>
      </div>
    `;
    const btnReset = document.getElementById('btnEmptyResetFilters');
    if (btnReset) btnReset.addEventListener('click', resetAllFilters);
    return;
  }

  container.innerHTML = products.map(p => {
    const salePrice = p.salePrice || p.regularPrice;
    const regularPrice = p.regularPrice;
    const discountPercent = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;
    const mainImg = (p.images && p.images[0]) ? p.images[0] : 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600';
    const stockCount = p.stockCount !== undefined ? p.stockCount : 15;
    const isOut = stockCount <= 0 || !p.inStock;
    const isLow = !isOut && stockCount <= 10;

    return `
      <div class="product-card ${isOut ? 'product-out-of-stock' : ''}" data-id="${p._id}">
        <div class="product-thumb-wrap">
          <div class="product-badges">
            ${isOut ? `<span class="badge badge-hot">Out of Stock</span>` : ''}
            ${isLow ? `<span class="badge" style="background: #FFB703; color: #000; font-weight: 800;">Only ${stockCount} Left!</span>` : ''}
            ${discountPercent > 0 && !isOut ? `<span class="badge badge-sale">-${discountPercent}%</span>` : ''}
            ${p.badge ? `<span class="badge badge-new">${p.badge}</span>` : ''}
          </div>

          <div class="product-hover-actions">
            <a href="/product?id=${p.slug || p._id}" class="action-circle-btn" title="View Product Details">👁️</a>
          </div>

          <a href="/product?id=${p.slug || p._id}" class="product-img-link" style="display: block; width: 100%; height: 100%;">
            <img src="${mainImg}" alt="${p.title}" class="product-img-main" loading="lazy" style="${isOut ? 'filter: grayscale(80%); opacity: 0.7;' : ''}">
          </a>
        </div>

        <div class="product-info">
          <div class="product-category-meta">${p.category}</div>
          <h3 class="product-name">
            <a href="/product?id=${p.slug || p._id}" class="product-title-link" data-id="${p._id}">${p.title}</a>
          </h3>

          <div class="product-rating">
            <div class="stars">★★★★★</div>
            <span class="review-count">(${p.reviewCount || 24})</span>
          </div>

          <div class="product-price-row">
            <div>
              <span class="current-price">Rs. ${salePrice.toLocaleString()}</span>
              ${regularPrice > salePrice ? `<span class="original-price">Rs. ${regularPrice.toLocaleString()}</span>` : ''}
            </div>
            ${discountPercent > 0 ? `<span class="discount-calc">SAVE ${discountPercent}%</span>` : ''}
          </div>

          ${isLow ? `
            <div class="product-stock-urgency" style="font-size: 0.78rem; font-weight: 700; color: #FFB703; margin: 4px 0 8px; display: flex; align-items: center; gap: 5px;">
              <span>⚠️</span> only ${stockCount} items in stock
            </div>
          ` : ''}

          ${isOut ? `
            <button class="btn-add-cart disabled" disabled style="opacity: 0.5; cursor: not-allowed; background: var(--bg-elevated); border-color: var(--border-muted);">
              Out of Stock
            </button>
          ` : `
            <button class="btn-add-cart btn-add-to-cart" data-id="${p._id}">
              <span>🛒</span> Add to Cart
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Attach button events
  container.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = products.find(p => p._id === id);
      if (prod) {
        addToCart(prod, 1);
      }
    });
  });
}

function renderActivePills(count) {
  const container = document.getElementById('activeFilterPills');
  if (!container) return;

  const pills = [];

  if (currentCategory !== 'all') {
    const cat = allCategories.find(c => c.slug === currentCategory);
    pills.push({
      label: cat ? cat.name : currentCategory,
      onRemove: () => setCategoryFilter('all')
    });
  }

  if (inStockOnly) {
    pills.push({
      label: 'In Stock Only',
      onRemove: () => {
        inStockOnly = false;
        const cb = document.getElementById('filterInStockCheckbox');
        if (cb) cb.checked = false;
        applyFiltersAndRender();
      }
    });
  }

  if (dealsOnly) {
    pills.push({
      label: 'Deals & Sale',
      onRemove: () => {
        dealsOnly = false;
        const cb = document.getElementById('filterDealsCheckbox');
        if (cb) cb.checked = false;
        applyFiltersAndRender();
      }
    });
  }

  if (currentPriceFilter !== 'all') {
    let lbl = currentPriceFilter;
    if (currentPriceFilter === 'under2500') lbl = '< Rs. 2,500';
    if (currentPriceFilter === '2500-4000') lbl = 'Rs. 2,500 - 4,000';
    if (currentPriceFilter === 'above4000') lbl = '> Rs. 4,000';

    pills.push({
      label: lbl,
      onRemove: () => {
        currentPriceFilter = 'all';
        document.querySelectorAll('.price-option-pill').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-range') === 'all');
        });
        applyFiltersAndRender();
      }
    });
  }

  if (currentSearch) {
    pills.push({
      label: `"${currentSearch}"`,
      onRemove: () => {
        currentSearch = '';
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) searchInput.value = '';
        applyFiltersAndRender();
      }
    });
  }

  container.innerHTML = pills.map((p, idx) => `
    <span class="filter-pill">
      ${p.label} <span class="filter-pill-remove" data-idx="${idx}">✕</span>
    </span>
  `).join('');

  container.querySelectorAll('.filter-pill-remove').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx'), 10);
      if (pills[idx]) pills[idx].onRemove();
    });
  });
}

function resetAllFilters() {
  currentCategory = 'all';
  currentPriceFilter = 'all';
  inStockOnly = false;
  dealsOnly = false;
  currentSort = 'featured';
  currentSearch = '';

  const cbStock = document.getElementById('filterInStockCheckbox');
  const cbDeals = document.getElementById('filterDealsCheckbox');
  const sortSelect = document.getElementById('catalogSortSelect');
  const searchInput = document.getElementById('globalSearchInput');

  if (cbStock) cbStock.checked = false;
  if (cbDeals) cbDeals.checked = false;
  if (sortSelect) sortSelect.value = 'featured';
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.price-option-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-range') === 'all');
  });

  setCategoryFilter('all');
}

function setupFilterEventListeners() {
  // In stock checkbox
  const cbStock = document.getElementById('filterInStockCheckbox');
  if (cbStock) {
    cbStock.addEventListener('change', (e) => {
      inStockOnly = e.target.checked;
      applyFiltersAndRender();
    });
  }

  // Deals checkbox
  const cbDeals = document.getElementById('filterDealsCheckbox');
  if (cbDeals) {
    cbDeals.checked = dealsOnly;
    cbDeals.addEventListener('change', (e) => {
      dealsOnly = e.target.checked;
      applyFiltersAndRender();
    });
  }

  // Price range pills
  document.querySelectorAll('.price-option-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.price-option-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPriceFilter = pill.getAttribute('data-range');
      applyFiltersAndRender();
    });
  });

  // Sort dropdown
  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Reset Filters button
  const btnReset = document.getElementById('btnResetFilters');
  if (btnReset) {
    btnReset.addEventListener('click', resetAllFilters);
  }

  // Mobile Filter Drawer Toggle
  const btnMobile = document.getElementById('btnMobileFilter');
  const sidebar = document.getElementById('catalogSidebar');
  if (btnMobile && sidebar) {
    btnMobile.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Top Category dropdown toggle
  const catBtn = document.getElementById('categoryDropdownTrigger');
  const wrapper = document.querySelector('.category-menu-wrapper');
  if (catBtn && wrapper) {
    catBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      wrapper.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('active');
      }
    });
  }
}

function toggleCategoryDropdown(force) {
  const wrapper = document.querySelector('.category-menu-wrapper');
  if (wrapper) {
    if (typeof force === 'boolean') {
      wrapper.classList.toggle('active', force);
    } else {
      wrapper.classList.toggle('active');
    }
  }
}
