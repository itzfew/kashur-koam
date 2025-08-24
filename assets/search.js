// Enhanced client-side search + Mobile menu functionality
document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('search-input');
  let searchResults = document.getElementById('search-results');
  let searchIndex = [];

  // -------------------------
  // Search functionality
  // -------------------------
  if (searchInput) {
    // Load search index
    fetch('/search.json')
      .then(res => res.json())
      .then(data => {
        searchIndex = Array.isArray(data) ? data : [];
      })
      .catch(err => console.error('Error loading search index:', err));

    // Create results container if missing
    if (!searchResults) {
      searchResults = document.createElement('div');
      searchResults.id = 'search-results';
      searchResults.className = 'search-results';
      searchInput.parentNode.appendChild(searchResults);
    }

    // Search function
    function performSearch(query) {
      if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
      }

      const results = searchIndex.filter(item => {
        const q = query.toLowerCase();
        return (
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.content && item.content.toLowerCase().includes(q)) ||
          (item.categories && item.categories.some(cat => cat.toLowerCase().includes(q)))
        );
      });

      displayResults(results.slice(0, 8));
    }

    // Display results
    function displayResults(results) {
      if (!results.length) {
        searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResults.style.display = 'block';
        return;
      }

      searchResults.innerHTML = results
        .map(
          result => `
            <a href="${result.url}" class="search-result-item" tabindex="0">
              <div class="search-result-title">${result.title}</div>
              ${
                result.categories
                  ? `<div class="search-result-category">${result.categories.join(', ')}</div>`
                  : ''
              }
            </a>
          `
        )
        .join('');

      searchResults.style.display = 'block';
    }

    // Event listeners
    searchInput.addEventListener('input', e => {
      performSearch(e.target.value.trim().toLowerCase());
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.length >= 2) {
        searchResults.style.display = 'block';
      }
    });

    // Hide results when clicking outside
    document.addEventListener('click', e => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const firstResult = searchResults.querySelector('a');
        if (firstResult) firstResult.focus();
      }
    });

    searchResults.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = e.target.nextElementSibling || searchResults.querySelector('a');
        if (next) next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = e.target.previousElementSibling || searchInput;
        if (prev) prev.focus();
      }
    });
  }

  // -------------------------
  // Mobile menu functionality
  // -------------------------
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', function () {
      mainNav.classList.toggle('active');

      // Change icon based on menu state
      const icon = this.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !mainNav.classList.contains('active'));
        icon.classList.toggle('fa-times', mainNav.classList.contains('active'));
      }
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        dropdown.style.display = 'none';
      });
    }
  });
});
