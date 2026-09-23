// Order Tracking Client Controller for Onikuma Nepal
import { trackOrder, fetchSettings } from './api.js';

let settingsCache = null;

export function initTrackOrder() {
  const modal = document.getElementById('trackOrderModal');
  const openButtons = document.querySelectorAll('.btn-open-track, [href="#track-order"], #btnOpenTrackOrder');
  const closeBtn = document.getElementById('btnCloseTrackModal');
  const form = document.getElementById('trackOrderForm');
  const input = document.getElementById('trackOrderInput');

  // Open modal triggers
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openTrackModal();
    });
  });

  // Close modal triggers
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeTrackModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTrackModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeTrackModal();
    }
  });

  // Form submission
  if (form && input) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;

      const submitBtn = document.getElementById('btnSubmitTrack');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Track 🚀';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Searching...</span>';
      }

      await performTrack(query);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
}

export function openTrackModal(prefillQuery = '') {
  const modal = document.getElementById('trackOrderModal');
  const input = document.getElementById('trackOrderInput');
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (input) {
    if (prefillQuery) {
      input.value = prefillQuery;
      performTrack(prefillQuery);
    } else {
      setTimeout(() => input.focus(), 100);
    }
  }
}

export function closeTrackModal() {
  const modal = document.getElementById('trackOrderModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

async function performTrack(query) {
  const resultsContainer = document.getElementById('trackResultsArea');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `
    <div class="track-loading-state">
      <div class="track-spinner"></div>
      <p>Tracking your package with live Onikuma logistics...</p>
    </div>
  `;

  if (!settingsCache) {
    settingsCache = await fetchSettings();
  }
  const whatsappNum = settingsCache.whatsapp || '9864006883';

  const res = await trackOrder(query);

  if (!res.success || !res.data) {
    resultsContainer.innerHTML = `
      <div class="track-not-found">
        <div class="track-not-found-icon">🔍</div>
        <h4>Order Not Found</h4>
        <p>${res.message || 'We could not locate an order matching that identifier. Please verify your Order ID or phone number.'}</p>
        <div class="track-help-row">
          <span>Need help finding your order?</span>
          <a href="https://wa.me/977${whatsappNum.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi Onikuma Nepal, I need help checking the status of my order.')}" target="_blank" class="btn btn-whatsapp-sm">
            💬 WhatsApp Support
          </a>
        </div>
      </div>
    `;
    return;
  }

  const order = res.data;
  renderTrackResults(order, whatsappNum, resultsContainer);
}

function renderTrackResults(order, whatsappNum, container) {
  const status = order.status || 'Pending';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-NP', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Steps configuration
  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received in system', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Verified & packing', icon: '⚙️' },
    { key: 'dispatched', label: 'Dispatched', desc: 'On courier route', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', desc: 'Received in hands', icon: '🎉' }
  ];

  let currentStepIndex = 0;
  if (['Confirmed', 'Processing'].includes(status)) currentStepIndex = 1;
  else if (status === 'Dispatched') currentStepIndex = 2;
  else if (status === 'Delivered') currentStepIndex = 3;

  const isCancelled = status === 'Cancelled';
  const isReturned  = status === 'Returned';

  const statusColors = {
    Pending: '#f59e0b',
    Confirmed: '#6366f1',
    Processing: '#3b82f6',
    Dispatched: '#8b5cf6',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
    Returned: '#64748b'
  };
  const badgeColor = statusColors[status] || '#FF2E63';

  container.innerHTML = `
    <div class="track-order-card">
      
      <!-- Top Order Meta -->
      <div class="track-card-top">
        <div>
          <div class="track-order-num-label">Order Number</div>
          <div class="track-order-num">${order.orderNumber}</div>
          <div class="track-order-date">Placed on ${orderDate}</div>
        </div>
        <div class="track-status-pill" style="--pill-color: ${badgeColor};">
          <span class="status-pulse-dot" style="background:${badgeColor};"></span>
          ${status}
        </div>
      </div>

      <!-- Stepper Progress Bar -->
      ${isCancelled ? `
        <div class="track-alert-banner alert-cancelled">
          <span>❌</span>
          <div>
            <strong>Order Cancelled</strong>
            <p>This order has been cancelled. If you believe this was an error, please contact our support team below.</p>
          </div>
        </div>
      ` : isReturned ? `
        <div class="track-alert-banner alert-returned">
          <span>↩️</span>
          <div>
            <strong>Order Returned</strong>
            <p>This order was processed as returned. Warranty replacements or refunds are handled directly by customer support.</p>
          </div>
        </div>
      ` : `
        <div class="track-stepper-wrap">
          <div class="track-stepper">
            ${steps.map((st, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return `
                <div class="track-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                  <div class="track-step-circle">
                    ${isCompleted ? '✓' : st.icon}
                  </div>
                  <div class="track-step-text">
                    <span class="track-step-label">${st.label}</span>
                    <span class="track-step-desc">${st.desc}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `}

      <!-- Customer & Delivery Destination Info -->
      <div class="track-info-grid">
        <div class="track-info-box">
          <span class="track-info-icon">📍</span>
          <div>
            <div class="track-info-label">Delivery Destination</div>
            <div class="track-info-val">${order.city || 'Kathmandu'}${order.district ? ', ' + order.district : ''}</div>
          </div>
        </div>
        <div class="track-info-box">
          <span class="track-info-icon">👤</span>
          <div>
            <div class="track-info-label">Recipient</div>
            <div class="track-info-val">${order.customerName} (${order.phone})</div>
          </div>
        </div>
        <div class="track-info-box">
          <span class="track-info-icon">💳</span>
          <div>
            <div class="track-info-label">Payment Method</div>
            <div class="track-info-val" style="text-transform:uppercase;">${order.paymentMethod || 'Cash on Delivery'}</div>
          </div>
        </div>
        <div class="track-info-box">
          <span class="track-info-icon">💰</span>
          <div>
            <div class="track-info-label">Total Amount</div>
            <div class="track-info-val" style="color:var(--color-primary);font-weight:800;">Rs. ${(order.total || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <!-- Items in Order -->
      <div class="track-items-wrap">
        <div class="track-items-header">Items in this package (${order.items.length})</div>
        <div class="track-items-list">
          ${order.items.map(item => `
            <div class="track-item-row">
              <img src="${item.image || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=120'}" alt="${item.title}" class="track-item-img">
              <div class="track-item-meta">
                <span class="track-item-title">${item.title}</span>
                <span class="track-item-qty">Quantity: ${item.quantity}</span>
              </div>
              <span class="track-item-price">Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- WhatsApp Delivery Support Action -->
      <div class="track-card-footer">
        <a href="https://wa.me/977${whatsappNum.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi Onikuma Nepal Support, I am inquiring about my order ${order.orderNumber} (Status: ${order.status}).`)}" target="_blank" class="btn btn-whatsapp track-wa-btn">
          💬 Inquire About Delivery via WhatsApp
        </a>
      </div>

    </div>
  `;
}
