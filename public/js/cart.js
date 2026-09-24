// Shopping Cart Module for Onikuma Nepal
import { fetchProducts } from './api.js';
import { showToast } from './toast.js';

const CART_STORAGE_KEY = 'onikuma_nepal_cart';
const FREE_SHIPPING_THRESHOLD = 3000; // Rs. 3,000 for free delivery in Nepal

let cart = [];

export async function syncCartStock(liveProducts = null) {
  let products = liveProducts;
  if (!products) {
    try {
      products = await fetchProducts();
    } catch (e) {
      console.error('Failed to fetch live products for stock sync:', e);
      return;
    }
  }
  if (!Array.isArray(products)) return;
  if (!cart || cart.length === 0) return;

  let changed = false;
  const itemsAdjusted = [];
  const itemsRemoved = [];
  const validCart = [];

  cart.forEach(item => {
    // Robust fuzzy matching by ID, slug, modelCode, or title
    const prod = products.find(p =>
      (item.productId && (p._id === item.productId || p.slug === item.productId)) ||
      (item._id && (p._id === item._id || p.slug === item._id)) ||
      (item.modelCode && p.modelCode && item.modelCode.toUpperCase() === p.modelCode.toUpperCase()) ||
      (item.title && p.title && item.title.trim().toLowerCase() === p.title.trim().toLowerCase())
    );

    if (!prod) {
      // Product was deleted from store catalog
      itemsRemoved.push(item.title);
      changed = true;
      return;
    }

    const liveStock = prod.stockCount !== undefined ? Number(prod.stockCount) : 15;
    item.maxStock = liveStock;

    if (liveStock <= 0 || !prod.inStock) {
      itemsRemoved.push(`${item.title} (out of stock)`);
      changed = true;
      return;
    }

    if (item.quantity > liveStock) {
      itemsAdjusted.push({ title: item.title, from: item.quantity, to: liveStock });
      item.quantity = liveStock;
      changed = true;
    }

    validCart.push(item);
  });

  if (changed) {
    cart = validCart;
    saveCart();
    updateCartUI();

    if (itemsRemoved.length > 0) {
      showToast(`Removed deleted/unavailable item(s) from your cart: ${itemsRemoved.join(', ')}`, 'info');
    }
    if (itemsAdjusted.length > 0) {
      const details = itemsAdjusted.map(a => `"${a.title}": adjusted from ${a.from} to ${a.to} (max available in stock)`).join('\n');
      console.info('Cart clamped to available stock:\n' + details);
    }
  }
}

export function initCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    cart = [];
  }
  updateCartUI();
  setupCartEventListeners();

  // Validate cart against live catalog stock on initialization
  syncCartStock();
}

/**
 * Lightweight cart hydration from localStorage — no UI updates,
 * no event listeners, no stock sync. Use on pages that don't have
 * the cart drawer (e.g. checkout.html).
 */
export function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    cart = [];
  }
}

export function getCart() {
  return cart;
}

export function addToCart(product, quantity = 1) {
  const maxStock = product.stockCount !== undefined ? Number(product.stockCount) : 15;
  if (maxStock <= 0 || !product.inStock) {
    showToast(`Sorry, "${product.title}" is currently out of stock!`, 'warning');
    return;
  }

  const existing = cart.find(item =>
    item._id === product._id ||
    item.productId === product._id ||
    (item.modelCode && product.modelCode && item.modelCode.toUpperCase() === product.modelCode.toUpperCase()) ||
    (item.title && product.title && item.title.trim().toLowerCase() === product.title.trim().toLowerCase())
  );

  if (existing) {
    existing.maxStock = maxStock;
    if (existing.quantity >= maxStock) {
      showToast(`Cannot add more. You already have the maximum available stock (${maxStock} units) in your cart.`, 'warning');
      openCartDrawer();
      return;
    }
    const desired = existing.quantity + quantity;
    if (desired > maxStock) {
      existing.quantity = maxStock;
      showToast(`Only ${maxStock} items available in stock. Quantity adjusted to max available (${maxStock}).`, 'warning');
    } else {
      existing.quantity = desired;
    }
  } else {
    const qty = Math.min(quantity, maxStock);
    if (quantity > maxStock) {
      showToast(`Only ${maxStock} items available in stock. Added ${maxStock} to cart.`, 'warning');
    }
    cart.push({
      productId: product._id,
      _id: product._id,
      title: product.title,
      price: product.salePrice || product.regularPrice,
      image: (product.images && product.images[0]) ? product.images[0] : 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200',
      modelCode: product.modelCode || '',
      quantity: qty,
      maxStock: maxStock
    });
  }
  saveCart();
  updateCartUI();
  openCartDrawer();
}

export function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId && item._id !== productId);
  saveCart();
  updateCartUI();
}

export function updateQuantity(productId, newQty) {
  const item = cart.find(item => item.productId === productId || item._id === productId);
  if (item) {
    if (newQty <= 0) {
      removeFromCart(productId);
    } else {
      const max = item.maxStock !== undefined ? item.maxStock : 15;
      if (newQty > max) {
        item.quantity = max;
        showToast(`You can only select up to ${max} units (available in stock).`, 'warning');
      } else {
        item.quantity = newQty;
      }
      saveCart();
      updateCartUI();
    }
  }
}

export function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

export function getSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Could not save cart:', e);
  }
}

export function openCartDrawer() {
  syncCartStock();
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

export function updateCartUI() {
  const countBadges = document.querySelectorAll('.cart-badge-count');
  const totalDisplay = document.querySelectorAll('.cart-total-amount');
  const cartItemsContainer = document.getElementById('cartDrawerItems');
  const cartFooter = document.getElementById('cartDrawerFooter');

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getSubtotal();

  countBadges.forEach(b => b.textContent = totalCount);
  totalDisplay.forEach(d => d.textContent = `Rs. ${subtotal.toLocaleString()}`);

  // Update Free shipping progress
  const progressText = document.getElementById('freeShippingText');
  const progressFill = document.getElementById('freeShippingFill');
  if (progressText && progressFill) {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      progressText.innerHTML = `🎉 <strong>Congratulations!</strong> You get FREE Kathmandu Valley Delivery!`;
      progressFill.style.width = '100%';
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
      const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
      progressText.innerHTML = `Add <strong>Rs. ${remaining.toLocaleString()}</strong> more for FREE Delivery in KTM!`;
      progressFill.style.width = `${pct}%`;
    }
  }

  // Render items list
  if (cartItemsContainer) {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">🛒</div>
          <h3 style="color: #fff; margin-bottom: 6px;">Your cart is empty</h3>
          <p style="font-size: 0.85rem; margin-bottom: 20px;">Explore Onikuma Nepal's elite gaming headsets, keyboards, and accessories!</p>
          <button class="btn btn-primary" id="emptyCartExploreBtn">Browse Catalog</button>
        </div>
      `;
      if (cartFooter) cartFooter.style.display = 'none';

      const exploreBtn = document.getElementById('emptyCartExploreBtn');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
          closeCartDrawer();
          const target = document.getElementById('productsSection');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
      }
    } else {
      if (cartFooter) cartFooter.style.display = 'flex';
      cartItemsContainer.innerHTML = cart.map(item => {
        const max = item.maxStock !== undefined ? item.maxStock : 15;
        const isMaxReached = item.quantity >= max;

        return `
        <div class="cart-item-card" data-id="${item.productId}">
          <img src="${item.image}" alt="${item.title}" class="cart-item-thumb">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.title}</div>
            <div class="cart-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
            <div class="cart-item-qty-row">
              <div class="qty-control">
                <button class="qty-btn btn-minus" data-id="${item.productId}">-</button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-btn btn-plus" data-id="${item.productId}" ${isMaxReached ? 'disabled style="opacity: 0.35; cursor: not-allowed;" title="Maximum stock reached"' : ''}>+</button>
              </div>
              <button class="cart-remove-btn btn-remove" data-id="${item.productId}" title="Remove item">
                🗑️ Remove
              </button>
            </div>
            ${isMaxReached ? `<div style="font-size: 0.72rem; color: #FFB703; font-weight: 700; margin-top: 5px;">⚠️ Max available stock reached (${max} units)</div>` : ''}
          </div>
        </div>
      `;
      }).join('');

      // Add listeners to item buttons
      cartItemsContainer.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const current = cart.find(i => i.productId === id || i._id === id);
          if (current) updateQuantity(id, current.quantity - 1);
        });
      });

      cartItemsContainer.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const current = cart.find(i => i.productId === id || i._id === id);
          if (current) {
            const max = current.maxStock !== undefined ? current.maxStock : 15;
            if (current.quantity >= max) {
              showToast(`Only ${max} items available in stock! Cannot add more.`, 'warning');
              return;
            }
            updateQuantity(id, current.quantity + 1);
          }
        });
      });

      cartItemsContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          removeFromCart(id);
        });
      });
    }
  }
}

function setupCartEventListeners() {
  const openBtns = document.querySelectorAll('.trigger-cart-drawer');
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  const closeBtn = document.getElementById('cartDrawerClose');
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

  const backdrop = document.getElementById('drawerBackdrop');
  if (backdrop) backdrop.addEventListener('click', closeCartDrawer);

  const proceedBtn = document.getElementById('btnProceedCheckout');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (cart.length === 0) {
        showToast('Your cart is empty! Please add products before checking out.', 'warning');
        return;
      }
      closeCartDrawer();
      window.location.href = '/checkout';
    });
  }
}
