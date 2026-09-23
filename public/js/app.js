// Main Storefront Application Controller for Onikuma Nepal
import { fetchCategories, fetchProducts, fetchSettings } from './api.js';
import { initCart, addToCart, openCartDrawer, syncCartStock } from './cart.js';
import { initSearch } from './search.js';
import { initQuickView, openQuickView } from './quickview.js';
import { initCheckout } from './checkout.js';

let allCategories = [];
let currentCategoryFilter = 'all';
let heroSliderTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  initCart();
  initSearch();
  initQuickView();
  initCheckout();

  await loadStoreSettings();
  await loadCategories();
  const initialProducts = await loadProducts();
  if (initialProducts) {
    renderHeroSlider(initialProducts);
  }

  initCountdownTimer();
  setupNavigationEvents();

  // Listen to custom search filter event from search form
  window.addEventListener('filter-products-search', async (e) => {
    const { search } = e.detail;
    const prods = await fetchProducts({ search });
    renderProductGrid(prods);
    const title = document.getElementById('productSectionHeading');
    if (title) title.textContent = `Search Results for "${search}"`;
    const target = document.getElementById('productsSection');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

async function loadStoreSettings() {
  const settings = await fetchSettings();
  const hotlineEls = document.querySelectorAll('.hotline-text');
  const whatsappEls = document.querySelectorAll('.whatsapp-number-text');
  const announcementEl = document.getElementById('topbarAnnouncement');

  if (settings.hotline) {
    hotlineEls.forEach(el => el.textContent = settings.hotline);
  }
  if (settings.whatsapp) {
    whatsappEls.forEach(el => el.textContent = settings.whatsapp);
  }
  if (settings.announcement && announcementEl) {
    announcementEl.textContent = settings.announcement;
  }
}

// ---------------- DYNAMIC CATEGORIES RENDER ---------------- //
async function loadCategories() {
  allCategories = await fetchCategories();
  renderCategoryDropdownMenu();
  renderCategorySidebar();
  renderCategorySearchSelect();
  renderCategoryGrid();
  renderFilterTabs();
}

// 1. "All Categories" dropdown menu (in top header navigation)
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
      filterByCategory(slug);
      toggleCategoryDropdown(false);
      const target = document.getElementById('productsSection');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// 2. Sidebar categories (embedded on hero row)
function renderCategorySidebar() {
  const sidebar = document.getElementById('heroCategorySidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div style="background: linear-gradient(135deg, var(--color-primary), #B3003B); color: #fff; padding: 14px 18px; font-weight: 800; font-size: 0.92rem; display: flex; align-items: center; gap: 8px;">
      <span>☰</span> ALL ONIKUMA CATEGORIES
    </div>
    ${allCategories.map(cat => `
      <div class="category-menu-item" data-slug="${cat.slug}">
        <div class="category-item-left">
          <span class="category-item-icon">${cat.icon || '🎮'}</span>
          <span>${cat.name}</span>
        </div>
        <span style="color: var(--text-muted); font-size: 0.8rem;">›</span>
      </div>
    `).join('')}
  `;

  sidebar.querySelectorAll('.category-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const slug = item.getAttribute('data-slug');
      filterByCategory(slug);
      const target = document.getElementById('productsSection');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// 3. Search Bar Category Select
function renderCategorySearchSelect() {
  const select = document.getElementById('searchCategorySelect');
  if (!select) return;

  select.innerHTML = `<option value="all">All Categories</option>` +
    allCategories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
}

// 4. Featured Category Cards (Carousel / Grid)
function renderCategoryGrid() {
  const container = document.getElementById('featuredCategoriesGrid');
  if (!container) return;

  container.innerHTML = allCategories.map(cat => `
    <div class="category-card" data-slug="${cat.slug}">
      <div class="category-card-icon">${cat.icon || '🎧'}</div>
      <div class="category-card-name">${cat.name}</div>
      <div class="category-card-count">Explore Gear</div>
    </div>
  `).join('');

  container.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.getAttribute('data-slug');
      filterByCategory(slug);
      const target = document.getElementById('productsSection');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// 5. Filter Tabs above Product Grid
function renderFilterTabs() {
  const container = document.getElementById('filterTabsWrapper');
  if (!container) return;

  let tabsHtml = `<button class="filter-tab active" data-slug="all">🔥 All Gear</button>`;
  tabsHtml += allCategories.map(cat => `
    <button class="filter-tab" data-slug="${cat.slug}">
      ${cat.icon || ''} ${cat.name}
    </button>
  `).join('');

  container.innerHTML = tabsHtml;

  container.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const slug = tab.getAttribute('data-slug');
      filterByCategory(slug);
    });
  });
}

// ---------------- PRODUCTS RENDER ---------------- //
async function loadProducts(params = {}) {
  const products = await fetchProducts(params);
  syncCartStock(products);
  renderProductGrid(products);
  return products;
}

function renderProductGrid(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  // Limit display to maximum 4 products
  const displayProducts = Array.isArray(products) ? products.slice(0, 4) : [];

  if (displayProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: var(--bg-card); border-radius: var(--radius-md);">
        <h3 style="color: #fff; margin-bottom: 8px;">No Products Found</h3>
        <p style="color: var(--text-secondary);">There are currently no products in this category. Check other categories or visit Admin to add products!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = displayProducts.map(p => {
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
            <span class="review-count">(${p.reviewCount || 18})</span>
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

  // Attach button click events
  grid.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const prod = products.find(p => p._id === id);
      if (prod) {
        const count = prod.stockCount !== undefined ? prod.stockCount : 15;
        if (count <= 0 || !prod.inStock) {
          showToast(`"${prod.title}" is out of stock!`, 'error');
          return;
        }
        addToCart(prod, 1);
        showToast(`Added "${prod.title}" to cart!`, 'success');
      }
    });
  });

}

async function filterByCategory(slug) {
  currentCategoryFilter = slug;
  const title = document.getElementById('productSectionHeading');

  if (slug === 'all') {
    if (title) title.textContent = 'Official ONIKUMA Gaming Gear';
    await loadProducts();
  } else {
    const cat = allCategories.find(c => c.slug === slug);
    if (title) title.textContent = cat ? `${cat.name} Collection` : 'Category Products';
    await loadProducts({ category: slug });
  }

  // Update tabs active state
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-slug') === slug) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// ---------------- DYNAMIC HERO SLIDER (ONE PRODUCT PER CATEGORY) ---------------- //
function renderHeroSlider(products) {
  const container = document.getElementById('dynamicHeroSlides');
  const dotsContainer = document.getElementById('heroSliderDots');
  const taglineEl = document.getElementById('heroBannerTagline');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="hero-slide active" style="background: linear-gradient(135deg, #1C0F18 0%, #100A16 45%, #080C14 100%);">
        <div class="hero-slide-content">
          <span class="hero-badge hero-badge-crimson">⚡ OFFICIAL STORE</span>
          <h1 class="hero-title">WELCOME TO <span class="highlight-pink">ONIKUMA</span> NEPAL</h1>
          <p class="hero-desc">Authentic esports gaming headsets, mechanical keyboards, gaming mice & accessories with 1-Year official replacement warranty in Kathmandu.</p>
          <div class="hero-actions">
            <a href="/products" class="btn btn-sakura"><span>🔥</span> Explore Catalog</a>
            <a href="https://wa.me/9779864006883" target="_blank" class="btn btn-whatsapp"><span>💬</span> Chat on WhatsApp</a>
          </div>
        </div>
        <div class="hero-image-wrap">
          <img src="/logo.png" alt="Onikuma Nepal" style="max-height: 220px; object-fit: contain;">
        </div>
      </div>
    `;
    if (dotsContainer) dotsContainer.innerHTML = '';
    return;
  }

  // Select one representative product from each category
  const categorySlides = [];
  const seenCategories = new Set();

  if (allCategories && allCategories.length > 0) {
    allCategories.forEach(cat => {
      const matching = products.filter(p => p.categorySlug === cat.slug || p.category === cat.name);
      if (matching.length > 0) {
        // Find best candidate: prefer product with image and discount
        const best = matching.find(p => p.images && p.images.length > 0 && p.salePrice && p.regularPrice > p.salePrice)
                  || matching.find(p => p.images && p.images.length > 0)
                  || matching[0];
        categorySlides.push({
          product: best,
          categoryName: cat.name,
          categoryIcon: cat.icon || '🎮',
          categorySlug: cat.slug
        });
        seenCategories.add(cat.slug);
      }
    });
  }

  // Fallback if some products are uncategorized
  if (categorySlides.length === 0) {
    products.forEach(p => {
      const key = p.categorySlug || p.category || 'general';
      if (!seenCategories.has(key)) {
        seenCategories.add(key);
        categorySlides.push({
          product: p,
          categoryName: p.category || 'Featured Gear',
          categoryIcon: '🔥',
          categorySlug: p.categorySlug || 'all'
        });
      }
    });
  }

  // Dynamically calculate highest discount among products
  let maxDiscount = 0;
  products.forEach(p => {
    if (p.regularPrice && p.salePrice && p.regularPrice > p.salePrice) {
      const disc = Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100);
      if (disc > maxDiscount) maxDiscount = disc;
    }
  });

  if (taglineEl) {
    if (maxDiscount > 0) {
      taglineEl.innerHTML = `Up to <strong>${maxDiscount}% OFF</strong> Onikuma Gaming Gear & Headsets!`;
    } else {
      taglineEl.innerHTML = `Official <strong>ONIKUMA Nepal</strong> Gaming Store`;
    }
  }

  // Color themes for cycling through categories
  const themes = [
    { bg: 'linear-gradient(135deg, #1C0F18 0%, #100A16 45%, #080C14 100%)', badgeClass: 'hero-badge-crimson', btnClass: 'btn-sakura', highlight: 'highlight-pink' },
    { bg: 'linear-gradient(135deg, #1C121A 0%, #0C080B 100%)', badgeClass: 'hero-badge-pink', btnClass: 'btn-sakura', highlight: 'highlight-pink' },
    { bg: 'linear-gradient(135deg, #111722 0%, #070B10 100%)', badgeClass: 'hero-badge-cyan', btnClass: 'btn-cyan', highlight: 'highlight-cyan' },
    { bg: 'linear-gradient(135deg, #1C170A 0%, #0E0B05 100%)', badgeClass: 'hero-badge-crimson', btnClass: 'btn-sakura', highlight: 'highlight-pink' },
    { bg: 'linear-gradient(135deg, #160F1F 0%, #0B0711 100%)', badgeClass: 'hero-badge-pink', btnClass: 'btn-cyan', highlight: 'highlight-cyan' },
    { bg: 'linear-gradient(135deg, #0F1A1C 0%, #060E0F 100%)', badgeClass: 'hero-badge-cyan', btnClass: 'btn-sakura', highlight: 'highlight-pink' }
  ];

  container.innerHTML = categorySlides.map((item, index) => {
    const p = item.product;
    const theme = themes[index % themes.length];
    const salePrice = p.salePrice || p.regularPrice;
    const regularPrice = p.regularPrice;
    const discount = (regularPrice && salePrice && regularPrice > salePrice)
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;
    const mainImg = (p.images && p.images[0]) ? p.images[0] : '/logo.png';
    const badgeText = `${item.categoryIcon} ${item.categoryName}`;
    const desc = p.description 
      ? (p.description.length > 140 ? p.description.slice(0, 140) + '...' : p.description) 
      : '100% genuine Onikuma gaming gear with 1-Year official replacement warranty in Kathmandu.';

    return `
      <div class="hero-slide ${index === 0 ? 'active' : ''}" style="background: ${theme.bg};">
        <div class="hero-slide-content">
          <span class="hero-badge ${theme.badgeClass}">${badgeText}</span>
          <h2 class="hero-title">${p.title}</h2>
          <p class="hero-desc">${desc}</p>
          <div class="hero-price-tag">
            <span class="hero-sale-price">Rs. ${salePrice.toLocaleString()}</span>
            ${discount > 0 ? `<span class="hero-regular-price">Rs. ${regularPrice.toLocaleString()}</span>` : ''}
            ${discount > 0 ? `<span class="badge badge-sale">-${discount}% OFF</span>` : ''}
          </div>
          <div class="hero-actions">
            <a href="/product?id=${p.slug || p._id}" class="btn ${theme.btnClass}">
              <span>👁️</span> View Details
            </a>
            <a href="/products?category=${item.categorySlug}" class="btn btn-secondary" style="border-color: var(--border-subtle);">
              <span>${item.categoryIcon}</span> Browse Category
            </a>
            <a href="https://wa.me/9779864006883?text=Hi%2C%20I%20am%20interested%20in%20${encodeURIComponent(p.title)}" target="_blank" class="btn btn-whatsapp">
              <span>💬</span> WhatsApp
            </a>
          </div>
        </div>
        <div class="hero-image-wrap">
          <a href="/product?id=${p.slug || p._id}" style="display: block;">
            <img src="${mainImg}" alt="${p.title}" style="max-height: 320px; width: auto; object-fit: contain;">
          </a>
        </div>
      </div>
    `;
  }).join('');

  if (dotsContainer) {
    if (categorySlides.length > 1) {
      dotsContainer.innerHTML = categorySlides.map((item, i) => `
        <div class="slider-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" title="${item.categoryName}"></div>
      `).join('');
    } else {
      dotsContainer.innerHTML = '';
    }
  }

  initHeroSlider();
}

function initHeroSlider() {
  if (heroSliderTimer) clearInterval(heroSliderTimer);
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  if (slides.length <= 1) return;

  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentSlide = index;
  }

  function startAutoplay() {
    if (heroSliderTimer) clearInterval(heroSliderTimer);
    heroSliderTimer = setInterval(() => {
      const next = (currentSlide + 1) % slides.length;
      showSlide(next);
    }, 6000);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-slide'), 10);
      showSlide(idx);
      startAutoplay();
    });
  });

  startAutoplay();
}

// ---------------- FLASH SALE COUNTDOWN TIMER ---------------- //
function initCountdownTimer() {
  const hoursEl = document.getElementById('timerHours');
  const minsEl = document.getElementById('timerMins');
  const secsEl = document.getElementById('timerSecs');

  if (!hoursEl || !minsEl || !secsEl) return;

  // 14 hours countdown from page load
  let totalSeconds = 14 * 3600 + 42 * 60 + 19;

  setInterval(() => {
    if (totalSeconds > 0) totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// ---------------- NAVIGATION & DROPDOWN EVENTS ---------------- //
function setupNavigationEvents() {
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

  // Quick category links in header
  const navLinks = document.querySelectorAll('.nav-filter-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = link.getAttribute('data-category');
      filterByCategory(slug);
      const target = document.getElementById('productsSection');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function toggleCategoryDropdown(show) {
  const wrapper = document.querySelector('.category-menu-wrapper');
  if (wrapper) {
    if (show !== undefined) {
      if (show) wrapper.classList.add('active');
      else wrapper.classList.remove('active');
    } else {
      wrapper.classList.toggle('active');
    }
  }
}


// ---------------- TOAST NOTIFICATION ---------------- //
export function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : 'ℹ️'}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}
