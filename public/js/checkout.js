import { getCart, getSubtotal, clearCart, closeCartDrawer, syncCartStock } from './cart.js';
import { createOrder, fetchSettings } from './api.js';
import { showToast } from './toast.js';

const WHATSAPP_NUMBER = '9864006883'; // Official Onikuma Nepal WhatsApp Support
const KATHMANDU_DELIVERY_FEE = 100;
const OUTSIDE_VALLEY_DELIVERY_FEE = 200;

let appliedPromo = null;

export function initCheckout() {
  const checkoutModal = document.getElementById('checkoutModal');
  const closeBtn = document.getElementById('checkoutCloseBtn');
  const openCheckoutBtn = document.getElementById('btnProceedCheckout');
  const checkoutForm = document.getElementById('checkoutForm');
  const paymentMethods = document.querySelectorAll('.payment-method-card');
  const valleyLocationSelect = document.getElementById('checkoutLocationType');

  if (openCheckoutBtn) {
    openCheckoutBtn.addEventListener('click', () => {
      closeCartDrawer();
      openCheckoutModal();
    });
  }

  if (closeBtn && checkoutModal) {
    closeBtn.addEventListener('click', closeCheckoutModal);
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) closeCheckoutModal();
    });
  }

  // Payment method card selection
  paymentMethods.forEach(card => {
    card.addEventListener('click', () => {
      paymentMethods.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Recalculate shipping based on location
  if (valleyLocationSelect) {
    valleyLocationSelect.addEventListener('change', updateCheckoutTotals);
  }

  // Promo code apply button
  const btnApplyPromo = document.getElementById('btnApplyPromo');
  const promoInput = document.getElementById('checkoutPromoInput');

  if (btnApplyPromo && promoInput) {
    btnApplyPromo.addEventListener('click', async () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) return;

      const settingsRes = await fetchSettings();
      const validCodes = (settingsRes && settingsRes.promoCodes) ? settingsRes.promoCodes : [
        { code: 'ONIKUMA10', discountPercent: 10, minSpend: 1500 },
        { code: 'FIRSTORDER', discountPercent: 5, minSpend: 1000 }
      ];

      const match = validCodes.find(c => c.code.toUpperCase() === code);
      const subtotal = getSubtotal();

      if (!match) {
        showToast(`Promo code "${code}" is invalid or expired.`, 'warning');
        return;
      }

      if (match.minSpend && subtotal < match.minSpend) {
        showToast(`Promo code "${code}" requires a minimum order of Rs. ${match.minSpend.toLocaleString()}.`, 'warning');
        return;
      }

      appliedPromo = match;
      const promoBadge = document.getElementById('promoAppliedBadge');
      if (promoBadge) {
        promoBadge.textContent = `✓ Code ${match.code} applied! (${match.discountPercent}% OFF)`;
        promoBadge.style.display = 'block';
      }
      updateCheckoutTotals();
    });
  }

  // WhatsApp Order Button
  const btnWhatsAppOrder = document.getElementById('btnWhatsAppCheckout');
  if (btnWhatsAppOrder) {
    btnWhatsAppOrder.addEventListener('click', handleWhatsAppDirectOrder);
  }

  // Submit standard order
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleStandardCheckoutSubmit);
  }
}

export async function openCheckoutModal() {
  await syncCartStock();
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty! Please add products before checking out.', 'warning');
    return;
  }

  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  renderCheckoutSummary();
  updateCheckoutTotals();

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkoutItemsContainer');
  const cart = getCart();
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <img src="${item.image}" alt="${item.title}" class="checkout-item-img">
      <div class="checkout-item-details">
        <div class="checkout-item-title">${item.title}</div>
        <div class="checkout-item-qty">Qty: ${item.quantity} × Rs. ${item.price.toLocaleString()}</div>
      </div>
      <div class="checkout-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `).join('');
}

function updateCheckoutTotals() {
  const subtotal = getSubtotal();
  const locationSelect = document.getElementById('checkoutLocationType');
  const isOutside = locationSelect ? locationSelect.value === 'outside' : false;

  let deliveryFee = 0;
  if (subtotal < 3000) {
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
  if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toLocaleString()}`;
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
  const subtotal = getSubtotal();

  const fullName = form.fullName.value.trim();
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();
  const address = form.address.value.trim();
  const city = form.city.value.trim();
  const district = form.district.value.trim();
  const province = form.province.value.trim();
  const locationType = form.locationType.value;
  const paymentMethod = form.paymentMethod.value;
  const notes = form.notes.value.trim();

  if (!fullName || !phone || !address || !city) {
    showToast('Please fill in all required customer details (Name, Phone, Address, City).', 'warning');
    return;
  }

  const deliveryFee = subtotal >= 3000 ? 0 : (locationType === 'outside' ? OUTSIDE_VALLEY_DELIVERY_FEE : KATHMANDU_DELIVERY_FEE);
  const discount = appliedPromo ? Math.round((subtotal * appliedPromo.discountPercent) / 100) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const orderPayload = {
    customer: {
      fullName,
      phone,
      email,
      address,
      city,
      district: district || 'Kathmandu',
      province: province || 'Bagmati',
      notes
    },
    items: cart.map(item => ({
      productId: item.productId,
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
    submitBtn.textContent = 'Processing Order...';
  }

  const response = await createOrder(orderPayload);

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order (Confirm)';
  }

  if (response.success) {
    const orderData = response.data;
    clearCart();
    renderSuccessModal(orderData);
  } else {
    showToast('Could not place order: ' + (response.message || 'Unknown error'), 'error');
  }
}

function handleWhatsAppDirectOrder(e) {
  e.preventDefault();
  const cart = getCart();
  if (cart.length === 0) return;

  const form = document.getElementById('checkoutForm');
  const fullName = form && form.fullName ? form.fullName.value.trim() : 'Customer';
  const phone = form && form.phone ? form.phone.value.trim() : '';
  const address = form && form.address ? form.address.value.trim() : '';
  const city = form && form.city ? form.city.value.trim() : '';
  const subtotal = getSubtotal();

  // Create message text
  let msg = `🔥 *NEW ORDER - ONIKUMA NEPAL* 🔥\n\n`;
  msg += `*Customer Details:*\n`;
  msg += `👤 Name: ${fullName}\n`;
  msg += `📞 Phone: ${phone || 'N/A'}\n`;
  msg += `📍 Address: ${address || 'N/A'}, ${city || ''}\n\n`;
  msg += `*Items Ordered:*\n`;
  cart.forEach((item, index) => {
    msg += `${index + 1}. ${item.title} (x${item.quantity}) - Rs. ${(item.price * item.quantity).toLocaleString()}\n`;
  });
  msg += `\n*Subtotal:* Rs. ${subtotal.toLocaleString()}\n`;
  msg += `*Store Contact:* +977 ${WHATSAPP_NUMBER}\n`;
  msg += `Please confirm my order and share delivery details!`;

  const encoded = encodeURIComponent(msg);
  const whatsappUrl = `https://wa.me/977${WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(whatsappUrl, '_blank');
}

function renderSuccessModal(order) {
  const body = document.getElementById('checkoutBody');
  const header = document.querySelector('.checkout-header-title h2');
  if (header) header.textContent = 'Order Confirmed! 🎉';

  if (body) {
    body.innerHTML = `
      <div class="order-success-modal" style="grid-column: span 2;">
        <div class="order-success-icon">✓</div>
        <h2 style="font-size: 1.8rem; margin-bottom: 8px; color: #FFFFFF;">Thank You for Your Order!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">
          Your order has been recorded in the database. Our Onikuma Nepal team will contact you shortly to confirm dispatch.
        </p>
        <div style="background: var(--bg-card); padding: 18px; border-radius: var(--radius-md); max-width: 500px; margin: 0 auto 24px auto; text-align: left; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--text-muted);">Order Number:</span>
            <strong style="color: var(--color-cyan); font-family: var(--font-mono);">${order.orderNumber}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--text-muted);">Total Amount:</span>
            <strong style="color: var(--color-primary);">Rs. ${order.total.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--text-muted);">Payment:</span>
            <strong style="color: #FFFFFF; text-transform: uppercase;">${order.paymentMethod}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Delivery Address:</span>
            <span style="color: var(--text-primary);">${order.customer.address}, ${order.customer.city}</span>
          </div>
        </div>
        <div style="display: flex; justify-content: center; gap: 14px;">
          <a href="https://wa.me/977${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Onikuma Nepal, I just placed order ${order.orderNumber}. Could you please confirm delivery status?`)}" target="_blank" class="btn btn-whatsapp">
            💬 Track via WhatsApp (${WHATSAPP_NUMBER})
          </a>
          <button class="btn btn-secondary" id="btnContinueShoppingSuccess">Continue Shopping</button>
        </div>
      </div>
    `;

    const continueBtn = document.getElementById('btnContinueShoppingSuccess');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        closeCheckoutModal();
        window.location.reload();
      });
    }
  }
}
