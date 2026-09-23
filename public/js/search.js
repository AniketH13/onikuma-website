// Live Instant Search Module for Onikuma Nepal
import { fetchProducts } from './api.js';
import { openQuickView } from './quickview.js';

let debounceTimeout = null;

export function initSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  const categorySelect = document.getElementById('searchCategorySelect');
  const searchForm = document.getElementById('globalSearchForm');

  if (!searchInput || !searchDropdown) return;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();
    const category = categorySelect ? categorySelect.value : 'all';

    if (query.length < 2) {
      searchDropdown.classList.remove('active');
      searchDropdown.innerHTML = '';
      return;
    }

    debounceTimeout = setTimeout(async () => {
      const results = await fetchProducts({ search: query, category: category !== 'all' ? category : undefined, limit: 6 });
      renderSearchResults(results, searchDropdown);
    }, 250);
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.remove('active');
    }
  });

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        // Scroll to products section and filter
        window.dispatchEvent(new CustomEvent('filter-products-search', { detail: { search: query } }));
        searchDropdown.classList.remove('active');
      }
    });
  }
}

function renderSearchResults(products, dropdown) {
  if (!products || products.length === 0) {
    dropdown.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 0.88rem;">
        No gaming gear found matching your search.
      </div>
    `;
    dropdown.classList.add('active');
    return;
  }

  dropdown.innerHTML = products.map(prod => `
    <div class="search-result-item" data-id="${prod._id}">
      <img src="${prod.images && prod.images[0] ? prod.images[0] : ''}" alt="${prod.title}" class="search-result-thumb">
      <div class="search-result-info">
        <div class="search-result-title">${prod.title}</div>
        <div class="search-result-price">Rs. ${(prod.salePrice || prod.regularPrice).toLocaleString()}</div>
      </div>
      <span class="badge badge-sale" style="font-size: 0.68rem;">View</span>
    </div>
  `).join('');

  dropdown.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      const found = products.find(p => p._id === id);
      if (found) {
        openQuickView(found);
        dropdown.classList.remove('active');
      }
    });
  });

  dropdown.classList.add('active');
}
