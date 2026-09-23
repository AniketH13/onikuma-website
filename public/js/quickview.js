// Quick View Modal Module for Onikuma Nepal
import { addToCart } from './cart.js';
import { showToast } from './toast.js';

let currentProduct = null;

export function initQuickView() {
  const modal = document.getElementById('quickViewModal');
  const closeBtn = document.getElementById('quickViewClose');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeQuickView);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeQuickView();
    });
  }
}

export function openQuickView(product) {
  currentProduct = product;
  const modal = document.getElementById('quickViewModal');
  if (!modal) return;

  const mainImg = document.getElementById('qvMainImg');
  const thumbsContainer = document.getElementById('qvThumbnails');
  const title = document.getElementById('qvTitle');
  const categoryBadge = document.getElementById('qvCategoryBadge');
  const salePrice = document.getElementById('qvSalePrice');
  const regPrice = document.getElementById('qvRegPrice');
  const stockNotice = document.getElementById('qvStockNotice');
  const desc = document.getElementById('qvDesc');
  const specsList = document.getElementById('qvSpecsList');
  const addCartBtn = document.getElementById('qvAddCartBtn');
  const qtyInput = document.getElementById('qvQtyInput');

  const stockCount = product.stockCount !== undefined ? product.stockCount : 15;
  const isOut = stockCount <= 0 || !product.inStock;
  const isLow = !isOut && stockCount <= 10;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'];

  if (mainImg) mainImg.src = images[0];

  // Render up to 5 thumbnails
  if (thumbsContainer) {
    if (images.length > 1) {
      thumbsContainer.innerHTML = images.slice(0, 5).map((img, idx) => `
        <img src="${img}" alt="Thumbnail ${idx + 1}" class="qv-thumb ${idx === 0 ? 'active' : ''}" data-src="${img}">
      `).join('');
      thumbsContainer.style.display = 'flex';

      thumbsContainer.querySelectorAll('.qv-thumb').forEach(thumb => {
        const switchImg = () => {
          thumbsContainer.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          if (mainImg) mainImg.src = thumb.getAttribute('data-src');
        };
        thumb.addEventListener('click', switchImg);
        thumb.addEventListener('mouseenter', switchImg);
      });
    } else {
      thumbsContainer.innerHTML = '';
      thumbsContainer.style.display = 'none';
    }
  }

  if (title) title.textContent = product.title;
  if (categoryBadge) categoryBadge.textContent = product.category || 'Gaming Gear';
  if (salePrice) salePrice.textContent = `Rs. ${(product.salePrice || product.regularPrice).toLocaleString()}`;
  if (regPrice) {
    if (product.regularPrice && product.regularPrice > product.salePrice) {
      regPrice.textContent = `Rs. ${product.regularPrice.toLocaleString()}`;
      regPrice.style.display = 'inline';
    } else {
      regPrice.style.display = 'none';
    }
  }

  // Stock Urgency Alert (<= 10 remaining)
  if (stockNotice) {
    if (isOut) {
      stockNotice.innerHTML = `<div class="qv-stock-alert-out">❌ Out of Stock - Currently Unavailable</div>`;
      stockNotice.style.display = 'block';
    } else if (isLow) {
      stockNotice.innerHTML = `<div class="qv-stock-alert-low">⚠️ Only ${stockCount} items left in stock - Order fast!</div>`;
      stockNotice.style.display = 'block';
    } else {
      stockNotice.innerHTML = `<div class="qv-stock-alert-in">✓ In Stock (${stockCount} available)</div>`;
      stockNotice.style.display = 'block';
    }
  }

  if (desc) desc.textContent = product.description || product.shortDesc || 'Official Onikuma gaming peripheral with premium ergonomic build and pro-grade sound.';

  // Render specs
  if (specsList && product.specs) {
    const specs = [
      { label: 'Driver / Sensor', val: product.specs.driver || 'Pro Optical' },
      { label: 'Connectivity', val: product.specs.connectivity || 'USB / 3.5mm' },
      { label: 'Lighting', val: product.specs.lighting || 'Dynamic RGB' },
      { label: 'Microphone', val: product.specs.microphone || 'Noise Canceling' },
      { label: 'Compatibility', val: product.specs.compatibility || 'PC, PS4, PS5, Switch, Mobile' },
      { label: 'Cable Length', val: product.specs.cableLength || '2.2m Braided' }
    ];

    specsList.innerHTML = specs.map(s => `
      <div class="spec-item">
        <span class="spec-label">${s.label}</span>
        <span class="spec-val">${s.val}</span>
      </div>
    `).join('');
  }

  // Quantity input handling constrained to inStock
  if (qtyInput) {
    if (isOut) {
      qtyInput.value = 0;
      qtyInput.disabled = true;
      qtyInput.max = 0;
    } else {
      qtyInput.disabled = false;
      qtyInput.value = 1;
      qtyInput.min = 1;
      qtyInput.max = stockCount;

      qtyInput.oninput = () => {
        let val = parseInt(qtyInput.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > stockCount) {
          val = stockCount;
          showToast(`You can only select up to ${stockCount} items (available in stock).`, 'warning');
        }
        qtyInput.value = val;
      };
    }
  }

  if (addCartBtn) {
    if (isOut) {
      addCartBtn.disabled = true;
      addCartBtn.textContent = 'Out of Stock';
      addCartBtn.style.opacity = '0.5';
      addCartBtn.style.cursor = 'not-allowed';
      addCartBtn.onclick = null;
    } else {
      addCartBtn.disabled = false;
      addCartBtn.innerHTML = '<span>🛒</span> Add to Cart';
      addCartBtn.style.opacity = '1';
      addCartBtn.style.cursor = 'pointer';

      // Re-bind click listener
      addCartBtn.onclick = () => {
        let qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
        if (qty > stockCount) {
          qty = stockCount;
        }
        addToCart(product, qty);
        closeQuickView();
      };
    }
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeQuickView() {
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
