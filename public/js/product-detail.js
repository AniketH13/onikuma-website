// Single Product Detail Page (PDP) Application Logic
import { fetchCategories, fetchProductById, fetchProducts, fetchSettings } from './api.js';
import { initCart, addToCart, openCartDrawer, syncCartStock } from './cart.js';
import { initSearch } from './search.js';
import { initCheckout, openCheckoutModal } from './checkout.js';

let currentProduct = null;
let currentQuantity = 1;
const WHATSAPP_PHONE = '9864006883';

document.addEventListener('DOMContentLoaded', async () => {
  initCart();
  initSearch();
  initCheckout();

  await loadStoreSettings();

  const urlParams = new URLSearchParams(window.location.search);
  const idOrSlug = urlParams.get('id') || urlParams.get('slug');

  if (!idOrSlug) {
    showErrorState('No product specified. Please select a product from our catalog.');
    return;
  }

  await loadProduct(idOrSlug);
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

async function loadProduct(idOrSlug) {
  const prod = await fetchProductById(idOrSlug);

  if (!prod) {
    showErrorState(`Sorry, product could not be found or is unavailable.`);
    return;
  }

  currentProduct = prod;

  // Sync cart with live stock
  syncCartStock([prod]);

  renderProductDetails(prod);
  loadRelatedProducts(prod);
}

function renderProductDetails(p) {
  // Update document title
  document.title = `${p.title} | ONIKUMA Nepal Official Store`;

  // Breadcrumbs
  const breadcrumbCat = document.getElementById('pdpBreadcrumbCat');
  const breadcrumbTitle = document.getElementById('pdpBreadcrumbTitle');
  if (breadcrumbCat) {
    breadcrumbCat.textContent = p.category || 'Gaming Gear';
    breadcrumbCat.href = `/products?category=${p.categorySlug || ''}`;
  }
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = p.title;
  }

  // Gallery (Up to 5 images)
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'];

  const mainImg = document.getElementById('pdpMainImg');
  const thumbsContainer = document.getElementById('pdpThumbnails');

  if (mainImg) mainImg.src = images[0];

  if (thumbsContainer) {
    if (images.length > 1) {
      thumbsContainer.innerHTML = images.slice(0, 5).map((img, idx) => `
        <img src="${img}" alt="Thumbnail ${idx + 1}" class="pdp-thumb ${idx === 0 ? 'active' : ''}" data-src="${img}">
      `).join('');
      thumbsContainer.style.display = 'flex';

      thumbsContainer.querySelectorAll('.pdp-thumb').forEach(thumb => {
        const switchImg = () => {
          thumbsContainer.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          if (mainImg) mainImg.src = thumb.getAttribute('data-src');
        };
        thumb.addEventListener('click', switchImg);
        thumb.addEventListener('mouseenter', switchImg);
      });
    } else {
      thumbsContainer.style.display = 'none';
    }
  }

  // Header & Badges
  const catLink = document.getElementById('pdpCategoryLink');
  const modelCode = document.getElementById('pdpModelCode');
  const titleEl = document.getElementById('pdpTitle');
  const badgeWrap = document.getElementById('pdpBadgesGroup');

  if (catLink) {
    catLink.textContent = p.category || 'Gaming Peripheral';
    catLink.href = `/products?category=${p.categorySlug || ''}`;
  }
  if (modelCode) modelCode.textContent = p.modelCode ? `Model: ${p.modelCode}` : '';
  if (titleEl) titleEl.textContent = p.title;

  const stockCount = p.stockCount !== undefined ? Number(p.stockCount) : 15;
  const isOut = stockCount <= 0 || !p.inStock;
  const isLow = !isOut && stockCount <= 10;
  const salePrice = p.salePrice || p.regularPrice;
  const regularPrice = p.regularPrice;
  const discountPercent = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  if (badgeWrap) {
    badgeWrap.innerHTML = `
      ${isOut ? `<span class="badge badge-hot">Out of Stock</span>` : `<span class="badge badge-stock">Official Nepal Warranty</span>`}
      ${discountPercent > 0 && !isOut ? `<span class="badge badge-sale">-${discountPercent}% OFF</span>` : ''}
      ${p.badge ? `<span class="badge badge-new">${p.badge}</span>` : ''}
    `;
  }

  // Rating & Reviews
  const ratingEl = document.getElementById('pdpRatingVal');
  const reviewsEl = document.getElementById('pdpReviewsCount');
  if (ratingEl) ratingEl.textContent = (p.rating || 4.9).toFixed(1);
  if (reviewsEl) reviewsEl.textContent = `(${p.reviewCount || 48} verified Nepal gamer reviews)`;

  // Pricing
  const curPriceEl = document.getElementById('pdpCurrentPrice');
  const regPriceEl = document.getElementById('pdpRegularPrice');
  const saveBadgeEl = document.getElementById('pdpSaveBadge');

  if (curPriceEl) curPriceEl.textContent = `Rs. ${salePrice.toLocaleString()}`;
  if (regPriceEl) {
    if (regularPrice > salePrice) {
      regPriceEl.textContent = `Rs. ${regularPrice.toLocaleString()}`;
      regPriceEl.style.display = 'inline';
    } else {
      regPriceEl.style.display = 'none';
    }
  }
  if (saveBadgeEl) {
    if (discountPercent > 0) {
      saveBadgeEl.textContent = `SAVE Rs. ${(regularPrice - salePrice).toLocaleString()} (${discountPercent}%)`;
      saveBadgeEl.style.display = 'inline-block';
    } else {
      saveBadgeEl.style.display = 'none';
    }
  }

  // Stock Status Banner
  const stockBanner = document.getElementById('pdpStockBanner');
  if (stockBanner) {
    if (isOut) {
      stockBanner.className = 'pdp-stock-banner pdp-stock-out';
      stockBanner.innerHTML = `<span>❌</span> <strong>Out of Stock</strong> — Currently sold out. Inquire via WhatsApp for restock dates.`;
    } else if (isLow) {
      stockBanner.className = 'pdp-stock-banner pdp-stock-low';
      stockBanner.innerHTML = `<span>⚠️</span> <strong>Only ${stockCount} items left in stock</strong> — Order now before it runs out!`;
    } else {
      stockBanner.className = 'pdp-stock-banner pdp-stock-in';
      stockBanner.innerHTML = `<span>✓</span> <strong>In Stock (${stockCount} units available)</strong> — Ready for same-day dispatch in Kathmandu valley.`;
    }
  }

  // Description
  const descEl = document.getElementById('pdpDesc');
  if (descEl) {
    descEl.textContent = p.description || p.shortDesc || 'Official ONIKUMA gaming gear with ergonomic comfort, precision audio drivers, and durable tournament-grade construction.';
  }

  // Quantity input handling
  const qtyInput = document.getElementById('pdpQtyInput');
  const btnQtyMinus = document.getElementById('pdpQtyMinus');
  const btnQtyPlus = document.getElementById('pdpQtyPlus');
  const btnAddCart = document.getElementById('btnPdpAddCart');
  const btnBuyNow = document.getElementById('btnPdpBuyNow');
  const btnWhatsApp = document.getElementById('btnPdpWhatsApp');

  if (isOut) {
    if (qtyInput) {
      qtyInput.value = 0;
      qtyInput.disabled = true;
    }
    if (btnQtyMinus) btnQtyMinus.disabled = true;
    if (btnQtyPlus) btnQtyPlus.disabled = true;
    if (btnAddCart) {
      btnAddCart.disabled = true;
      btnAddCart.style.opacity = '0.5';
      btnAddCart.style.cursor = 'not-allowed';
      btnAddCart.textContent = 'Out of Stock';
    }
    if (btnBuyNow) {
      btnBuyNow.disabled = true;
      btnBuyNow.style.opacity = '0.5';
      btnBuyNow.style.cursor = 'not-allowed';
    }
  } else {
    currentQuantity = 1;
    if (qtyInput) {
      qtyInput.disabled = false;
      qtyInput.value = 1;
      qtyInput.min = 1;
      qtyInput.max = stockCount;

      qtyInput.oninput = () => {
        let v = parseInt(qtyInput.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        if (v > stockCount) {
          v = stockCount;
          alert(`You can only order up to ${stockCount} units (available in stock).`);
        }
        currentQuantity = v;
        qtyInput.value = v;
      };
    }

    if (btnQtyMinus) {
      btnQtyMinus.onclick = () => {
        if (currentQuantity > 1) {
          currentQuantity--;
          if (qtyInput) qtyInput.value = currentQuantity;
        }
      };
    }

    if (btnQtyPlus) {
      btnQtyPlus.onclick = () => {
        if (currentQuantity < stockCount) {
          currentQuantity++;
          if (qtyInput) qtyInput.value = currentQuantity;
        } else {
          alert(`Maximum stock reached! Only ${stockCount} units available.`);
        }
      };
    }

    if (btnAddCart) {
      btnAddCart.onclick = () => {
        addToCart(p, currentQuantity);
      };
    }

    if (btnBuyNow) {
      btnBuyNow.onclick = async () => {
        addToCart(p, currentQuantity);
        openCheckoutModal();
      };
    }
  }

  // WhatsApp Order Button
  if (btnWhatsApp) {
    btnWhatsApp.onclick = () => {
      const msg = encodeURIComponent(`Hi Onikuma Nepal! I want to order "${p.title}" (Qty: ${currentQuantity}, Rs. ${(salePrice * currentQuantity).toLocaleString()}). Please confirm delivery!`);
      window.open(`https://wa.me/977${WHATSAPP_PHONE}?text=${msg}`, '_blank');
    };
  }

  // Features List
  const featuresContainer = document.getElementById('pdpFeaturesList');
  if (featuresContainer) {
    const feats = Array.isArray(p.features) && p.features.length > 0 ? p.features : [
      'High-fidelity dynamic surround sound drivers',
      'Ergonomic memory foam cushions for extended play',
      'Noise-canceling microphone for crystal-clear team calls',
      'Multi-platform compatibility across PC, PS5, Switch & Mobile',
      '100% Genuine Onikuma product with official Nepal warranty'
    ];
    featuresContainer.innerHTML = feats.map(f => `<li>${f}</li>`).join('');
  }

  // Technical Specs Table
  const specsContainer = document.getElementById('pdpSpecsTable');
  if (specsContainer) {
    const s = p.specs || {};
    const hasAnySpec = Boolean(s.driver || s.connectivity || s.lighting || s.microphone || s.compatibility || s.cableLength || s.weight);

    let specsData = [];
    if (hasAnySpec) {
      if (s.driver) specsData.push({ label: 'Driver / Transducer', val: s.driver });
      if (s.connectivity) specsData.push({ label: 'Connectivity', val: s.connectivity });
      if (s.lighting) specsData.push({ label: 'Lighting', val: s.lighting });
      if (s.microphone) specsData.push({ label: 'Microphone', val: s.microphone });
      if (s.compatibility) specsData.push({ label: 'Compatibility', val: s.compatibility });
      if (s.cableLength) specsData.push({ label: 'Cable Length', val: s.cableLength });
      if (s.weight) specsData.push({ label: 'Weight', val: s.weight });
    } else {
      specsData = [
        { label: 'Driver / Transducer', val: '50mm High-definition Neodymium' },
        { label: 'Connectivity', val: '3.5mm Audio/Mic Jack + USB (for RGB Lighting)' },
        { label: 'Lighting', val: 'Dynamic Multi-color Breathing RGB' },
        { label: 'Microphone', val: '360° Flexible Omnidirectional Noise-Canceling' },
        { label: 'Compatibility', val: 'PC, PS4, PS5, Xbox One, Nintendo Switch, iPhone, Android' },
        { label: 'Cable Length', val: '2.2m Ultra-durable Braided Fiber Cable' },
        { label: 'Weight', val: '390g' }
      ];
    }

    specsContainer.innerHTML = specsData.map(row => `
      <tr>
        <td>${row.label}</td>
        <td>${row.val}</td>
      </tr>
    `).join('');
  }
}

async function loadRelatedProducts(currentProd) {
  const container = document.getElementById('pdpRelatedGrid');
  if (!container) return;

  const prods = await fetchProducts({ category: currentProd.categorySlug });
  const related = prods.filter(p => p._id !== currentProd._id).slice(0, 4);

  if (related.length === 0) {
    const fallbackProds = await fetchProducts();
    related.push(...fallbackProds.filter(p => p._id !== currentProd._id).slice(0, 4));
  }

  container.innerHTML = related.map(p => {
    const salePrice = p.salePrice || p.regularPrice;
    const regularPrice = p.regularPrice;
    const discount = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;
    const img = (p.images && p.images[0]) ? p.images[0] : 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600';
    const isOut = (p.stockCount !== undefined ? p.stockCount : 15) <= 0 || !p.inStock;

    return `
      <div class="product-card" data-id="${p._id}">
        <div class="product-thumb-wrap">
          <div class="product-badges">
            ${isOut ? `<span class="badge badge-hot">Out of Stock</span>` : ''}
            ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
            ${p.badge ? `<span class="badge badge-new">${p.badge}</span>` : ''}
          </div>
          <a href="/product?id=${p.slug || p._id}">
            <img src="${img}" alt="${p.title}" class="product-img-main" loading="lazy">
          </a>
        </div>
        <div class="product-info">
          <div class="product-category-meta">${p.category}</div>
          <h3 class="product-name">
            <a href="/product?id=${p.slug || p._id}">${p.title}</a>
          </h3>
          <div class="product-price-row">
            <div>
              <span class="current-price">Rs. ${salePrice.toLocaleString()}</span>
              ${regularPrice > salePrice ? `<span class="original-price">Rs. ${regularPrice.toLocaleString()}</span>` : ''}
            </div>
          </div>
          <a href="/product?id=${p.slug || p._id}" class="btn btn-secondary btn-block" style="text-align: center; margin-top: 10px; font-size: 0.85rem;">
            View Product Details →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function showErrorState(msg) {
  const container = document.getElementById('pdpMainContainer');
  if (container) {
    container.innerHTML = `
      <div style="padding: 80px 24px; text-align: center; background: var(--bg-card); border-radius: var(--radius-lg); margin: 40px auto; max-width: 600px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
        <h2 style="color: #fff; margin-bottom: 12px;">Product Not Found</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">${msg}</p>
        <a href="/products" class="btn btn-primary">Browse All Onikuma Products →</a>
      </div>
    `;
  }
}
