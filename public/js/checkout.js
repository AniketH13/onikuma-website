// Single Page Checkout Controller for Onikuma Nepal
import { getCart, getSubtotal, clearCart, syncCartStock } from './cart.js';
import { createOrder, fetchSettings } from './api.js';
import { showToast } from './toast.js';
import { initTrackOrder, openTrackModal } from './track-order.js';

const WHATSAPP_NUMBER = '9864006883'; // Official Onikuma Nepal WhatsApp Support
const KATHMANDU_DELIVERY_FEE = 100;
const OUTSIDE_VALLEY_DELIVERY_FEE = 200;
const FREE_SHIPPING_THRESHOLD = 3000;

let appliedPromo = null;

// Initialize checkout logic on any page
export function initCheckout() {
  const checkoutMainForm = document.getElementById('checkoutMainForm');
  
  if (checkoutMainForm) {
    // We are on the dedicated /checkout page!
    initCheckoutPage();
  }

  // Support cart drawer checkout triggers across other pages
  const openCheckoutBtns = document.querySelectorAll('#btnProceedCheckout, .btn-proceed-checkout');
  openCheckoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cart = getCart();
      if (!cart || cart.length === 0) {
        showToast('Your cart is empty! Please add products before checking out.', 'warning');
        return;
      }
      window.location.href = '/checkout';
    });
  });
}

// Backwards-compatible forwarder for any existing calls
export async function openCheckoutModal() {
  const cart = getCart();
  if (!cart || cart.length === 0) {
    showToast('Your cart is empty! Please add products before checking out.', 'warning');
    return;
  }
  window.location.href = '/checkout';
}

export function closeCheckoutModal() {
  // Obsolete modal compatibility
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('active');
}

// ---------------- Dedicated Checkout Page Controller ---------------- //
async function initCheckoutPage() {
  // Initialize track order modal if present
  try {
    initTrackOrder();
  } catch (err) {
    // Ignore track order init if not present
  }

  // Synchronize stock levels with server
  await syncCartStock();

  const cart = getCart();
  const emptyState = document.getElementById('checkoutEmptyState');
  const mainForm = document.getElementById('checkoutMainForm');

  if (!cart || cart.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (mainForm) mainForm.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (mainForm) mainForm.style.display = 'grid';

  // Render items and update totals
  renderCheckoutSummary();
  updateCheckoutTotals();

  // Location selector change (dynamic shipping fee recalculation)
  const locationSelect = document.getElementById('checkoutLocationType');
  if (locationSelect) {
    locationSelect.addEventListener('change', updateCheckoutTotals);
  }

  // Payment method selection cards
  setupPaymentMethods();

  // Promo Code handling
  setupPromoCode();

  // Standard Order submission
  mainForm.addEventListener('submit', handleStandardCheckoutSubmit);

  // WhatsApp Direct Order button
  const btnWhatsApp = document.getElementById('btnWhatsAppCheckout');
  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', handleWhatsAppDirectOrder);
  }
}

function setupPaymentMethods() {
  const paymentCards = document.querySelectorAll('.payment-method-card');
  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });
}

function setupPromoCode() {
  const btnApplyPromo = document.getElementById('btnApplyPromo');
  const promoInput = document.getElementById('checkoutPromoInput');
  const promoFeedback = document.getElementById('promoFeedbackBadge');

  if (btnApplyPromo && promoInput) {
    btnApplyPromo.addEventListener('click', async () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) {
        showToast('Please enter a promo code first.', 'info');
        return;
      }

      btnApplyPromo.disabled = true;
      btnApplyPromo.textContent = '...';

      try {
        const settingsRes = await fetchSettings();
        const validCodes = (settingsRes && settingsRes.promoCodes) ? settingsRes.promoCodes : [
          { code: 'ONIKUMA10', discountPercent: 10, minSpend: 1500 },
          { code: 'FIRSTORDER', discountPercent: 5, minSpend: 1000 }
        ];

        const match = validCodes.find(c => c.code.toUpperCase() === code);
        const subtotal = getSubtotal();

        if (!match) {
          showToast(`Promo code "${code}" is invalid or expired.`, 'warning');
          if (promoFeedback) promoFeedback.style.display = 'none';
          appliedPromo = null;
          updateCheckoutTotals();
          return;
        }

        if (match.minSpend && subtotal < match.minSpend) {
          showToast(`Promo code "${code}" requires a minimum order of Rs. ${match.minSpend.toLocaleString()}.`, 'warning');
          if (promoFeedback) promoFeedback.style.display = 'none';
          appliedPromo = null;
          updateCheckoutTotals();
          return;
        }

        appliedPromo = match;
        if (promoFeedback) {
          promoFeedback.textContent = `✓ Code ${match.code} applied! (${match.discountPercent}% OFF)`;
          promoFeedback.style.display = 'block';
        }
        showToast(`Code "${match.code}" applied! You saved ${match.discountPercent}%.`, 'success');
        updateCheckoutTotals();
      } catch (err) {
        showToast('Failed to validate promo code. Please try again.', 'error');
      } finally {
        btnApplyPromo.disabled = false;
        btnApplyPromo.textContent = 'Apply';
      }
    });
  }
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkoutItemsContainer');
  const countBadge = document.getElementById('checkoutItemCountBadge');
  const cart = getCart();

  if (countBadge) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    countBadge.textContent = `${totalQty} Item${totalQty === 1 ? '' : 's'}`;
  }

  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <div class="checkout-item-thumb-wrap">
        <img src="${item.image || '/images/logo.png'}" alt="${item.title}" class="checkout-item-img" onerror="this.src='/images/logo.png'">
        <span class="checkout-item-qty-badge">${item.quantity}</span>
      </div>
      <div class="checkout-item-details">
        <div class="checkout-item-title" title="${item.title}">${item.title}</div>
        <div class="checkout-item-price-meta">Rs. ${item.price.toLocaleString()} × ${item.quantity}</div>
      </div>
      <div class="checkout-item-total">
        Rs. ${(item.price * item.quantity).toLocaleString()}
      </div>
    </div>
  `).join('');
}

function updateCheckoutTotals() {
  const subtotal = getSubtotal();
  const locationSelect = document.getElementById('checkoutLocationType');
  const isOutside = locationSelect ? locationSelect.value === 'outside' : false;

  let deliveryFee = 0;
  if (subtotal < FREE_SHIPPING_THRESHOLD) {
    deliveryFee = isOutside ? OUTSIDE_VALLEY_DELIVERY_FEE : KATHMANDU_DELIVERY_FEE;
  }

  let discount = 0;
  if (appliedPromo) {
    discount = Math.round((subtotal * appliedPromo.discountPercent) / 100);
  }

  const total = Math.max(0, subtotal - discount + deliveryFee);

  const subtotalEl = document.getElementById('checkoutSubtotalVal');
  const deliveryEl = document.getElementById('checkoutDeliveryVal');
  const totalEl = document.getElementById('checkoutGrandTotalVal');
  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountEl = document.getElementById('checkoutDiscountVal');

  if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
  if (deliveryEl) {
    if (deliveryFee === 0) {
      deliveryEl.textContent = 'FREE';
      deliveryEl.style.color = 'var(--color-emerald)';
    } else {
      deliveryEl.textContent = `Rs. ${deliveryFee.toLocaleString()}`;
      deliveryEl.style.color = 'var(--color-cyan)';
    }
  }
  if (totalEl) totalEl.textContent = `Rs. ${total.toLocaleString()}`;

  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `- Rs. ${discount.toLocaleString()} (${appliedPromo.discountPercent}%)`;
    } else {
      discountRow.style.display = 'none';
    }
  }
}

async function handleStandardCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const cart = getCart();

  if (!cart || cart.length === 0) {
    showToast('Your cart is empty! Please add products before checking out.', 'warning');
    return;
  }

  const fullName = form.fullName ? form.fullName.value.trim() : '';
  const phone = form.phone ? form.phone.value.trim() : '';
  const address = form.address ? form.address.value.trim() : '';
  const city = form.city ? form.city.value.trim() : '';
  const district = form.district ? form.district.value.trim() : '';
  const locationType = form.locationType ? form.locationType.value : 'kathmandu';
  const paymentMethod = form.paymentMethod ? form.paymentMethod.value : 'cod';
  const notes = form.notes ? form.notes.value.trim() : '';

  if (!fullName) {
    showToast('Please enter your full name.', 'warning');
    form.fullName.focus();
    return;
  }

  if (!phone || phone.length < 9) {
    showToast('Please enter a valid Nepali mobile phone number (10 digits).', 'warning');
    form.phone.focus();
    return;
  }

  if (!address) {
    showToast('Please enter your street address / landmark.', 'warning');
    form.address.focus();
    return;
  }

  if (!city) {
    showToast('Please enter your delivery city or municipality.', 'warning');
    form.city.focus();
    return;
  }

  const subtotal = getSubtotal();
  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (locationType === 'outside' ? OUTSIDE_VALLEY_DELIVERY_FEE : KATHMANDU_DELIVERY_FEE);
  const discount = appliedPromo ? Math.round((subtotal * appliedPromo.discountPercent) / 100) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const orderPayload = {
    customer: {
      fullName,
      phone,
      email: '',
      address,
      city,
      district: district || (locationType === 'outside' ? 'Outside Valley' : 'Kathmandu'),
      province: locationType === 'outside' ? 'Nepal' : 'Bagmati',
      notes
    },
    items: cart.map(item => ({
      productId: item.productId || item._id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    })),
    subtotal,
    deliveryFee,
    discount,
    total,
    paymentMethod
  };

  const submitBtn = document.getElementById('btnSubmitOrder');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Processing Order...</span>`;
  }

  try {
    const response = await createOrder(orderPayload);

    if (response && response.success) {
      const orderData = response.data;
      clearCart();
      renderSuccessState(orderData);
      showToast('Order confirmed successfully! 🎉', 'success', 5000);
    } else {
      showToast('Could not place order: ' + ((response && response.message) || 'Please check your connection.'), 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Place Order (Confirm)</span><span>→</span>`;
      }
    }
  } catch (err) {
    showToast('An unexpected error occurred: ' + err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Place Order (Confirm)</span><span>→</span>`;
    }
  }
}

function handleWhatsAppDirectOrder(e) {
  e.preventDefault();
  const cart = getCart();
  if (!cart || cart.length === 0) {
    showToast('Your cart is empty! Please add products before ordering.', 'warning');
    return;
  }

  const form = document.getElementById('checkoutMainForm');
  const fullName = form && form.fullName ? form.fullName.value.trim() : 'Customer';
  const phone = form && form.phone ? form.phone.value.trim() : '';
  const address = form && form.address ? form.address.value.trim() : '';
  const city = form && form.city ? form.city.value.trim() : '';
  const locationType = form && form.locationType ? form.locationType.value : 'kathmandu';
  const notes = form && form.notes ? form.notes.value.trim() : '';

  const subtotal = getSubtotal();
  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (locationType === 'outside' ? OUTSIDE_VALLEY_DELIVERY_FEE : KATHMANDU_DELIVERY_FEE);
  const discount = appliedPromo ? Math.round((subtotal * appliedPromo.discountPercent) / 100) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  let msg = `🔥 *NEW ORDER - ONIKUMA NEPAL OFFICIAL* 🔥\n\n`;
  msg += `*Customer Details:*\n`;
  msg += `👤 Name: ${fullName}\n`;
  msg += `📞 Phone: ${phone || 'N/A'}\n`;
  msg += `📍 Address: ${address || 'N/A'}, ${city || ''} (${locationType === 'outside' ? 'Outside Valley' : 'Inside Valley'})\n`;
  if (notes) msg += `📝 Notes: ${notes}\n`;
  msg += `\n*Items Ordered:*\n`;
  cart.forEach((item, index) => {
    msg += `${index + 1}. ${item.title} (x${item.quantity}) - Rs. ${(item.price * item.quantity).toLocaleString()}\n`;
  });
  msg += `\n*Subtotal:* Rs. ${subtotal.toLocaleString()}\n`;
  msg += `*Delivery Fee:* ${deliveryFee === 0 ? 'FREE' : 'Rs. ' + deliveryFee.toLocaleString()}\n`;
  if (discount > 0) msg += `*Promo Discount:* - Rs. ${discount.toLocaleString()}\n`;
  msg += `*Total Amount:* Rs. ${total.toLocaleString()}\n`;
  msg += `*Payment:* Cash on Delivery (COD) / eSewa\n\n`;
  msg += `Please confirm my order and share courier dispatch details!`;

  const encoded = encodeURIComponent(msg);
  const whatsappUrl = `https://wa.me/977${WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(whatsappUrl, '_blank');
}

function renderSuccessState(order) {
  const mainForm = document.getElementById('checkoutMainForm');
  const successState = document.getElementById('checkoutSuccessState');
  const detailsBox = document.getElementById('successDetailsBox');
  const waBtn = document.getElementById('successWhatsAppTrackBtn');
  const trackBtn = document.getElementById('successTrackOrderBtn');

  if (mainForm) mainForm.style.display = 'none';
  if (successState) successState.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (detailsBox) {
    const paymentLabel = order.paymentMethod === 'esewa' ? 'eSewa Digital Wallet' : 'Cash on Delivery (COD)';
    const deliveryEstimated = order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee.toLocaleString()}`;

    detailsBox.innerHTML = `
      <div class="success-detail-row">
        <span>Order Number:</span>
        <strong style="color: var(--color-cyan); font-family: var(--font-mono); font-size: 1.1rem;">${order.orderNumber}</strong>
      </div>
      <div class="success-detail-row">
        <span>Customer:</span>
        <strong>${order.customer.fullName} (${order.customer.phone})</strong>
      </div>
      <div class="success-detail-row">
        <span>Delivery Address:</span>
        <span>${order.customer.address}, ${order.customer.city}</span>
      </div>
      <div class="success-detail-row">
        <span>Payment Method:</span>
        <strong style="color: var(--color-emerald);">${paymentLabel}</strong>
      </div>
      <div class="success-detail-row">
        <span>Delivery Fee:</span>
        <span>${deliveryEstimated}</span>
      </div>
      <div class="success-detail-row" style="padding-top: 10px; border-top: 1px solid var(--border-subtle); font-size: 1.15rem;">
        <span style="font-weight: 800; color: #fff;">Total Payable:</span>
        <strong style="color: var(--color-primary); font-size: 1.3rem;">Rs. ${order.total.toLocaleString()}</strong>
      </div>
    `;
  }

  if (waBtn) {
    const msg = encodeURIComponent(`Hi Onikuma Nepal, I just placed order ${order.orderNumber} for Rs. ${order.total.toLocaleString()}. Please confirm delivery!`);
    waBtn.href = `https://wa.me/977${WHATSAPP_NUMBER}?text=${msg}`;
  }

  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      openTrackModal(order.orderNumber);
    });
  }
}

// Auto-run if loaded directly as entry module on checkout page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}
