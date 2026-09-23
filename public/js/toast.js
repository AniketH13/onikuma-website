// Centralized Modern Toast Notification Utility for Onikuma Nepal
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    warning: '⚠️',
    warn: '⚠️',
    error: '✕',
    info: 'ℹ️'
  };

  const icon = icons[type] || 'ℹ️';
  const typeClass = type === 'warning' || type === 'warn'
    ? 'toast-warning'
    : (type === 'error' ? 'toast-error' : (type === 'success' ? 'toast-success' : 'toast-info'));

  const toast = document.createElement('div');
  toast.className = `toast ${typeClass}`;
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-msg">${message}</div>
    <button type="button" class="toast-close" title="Dismiss">✕</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => dismissToast(toast));
  }

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const timer = setTimeout(() => {
    dismissToast(toast);
  }, duration);

  toast._dismissTimer = timer;
}

function dismissToast(toast) {
  if (!toast || toast._isDismissing) return;
  toast._isDismissing = true;
  if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
  toast.classList.remove('show');
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}
