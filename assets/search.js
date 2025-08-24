// Enhanced client-side search with redirect to search results page
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  
  let searchIndex = [];
  let searchResults = document.getElementById('search-results');
  
  // Load search index
  fetch('/search.json')
    .then(response => response.json())
    .then(data => {
      searchIndex = data;
    })
    .catch(error => {
      console.error('Error loading search index:', error);
    });
  
  // Create search results container if it doesn't exist
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
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      
      const titleMatch = item.title && regex.test(item.title);
      const contentMatch = item.content && regex.test(item.content);
      const categoryMatch = item.categories && item.categories.some(cat => regex.test(cat));
      const tagsMatch = item.tags && item.tags.some(tag => regex.test(tag));
      
      return titleMatch || contentMatch || categoryMatch || tagsMatch;
    });
    
    // Sort by relevance
    results.sort((a, b) => {
      const aTitleMatch = a.title && new RegExp(query, 'i').test(a.title);
      const bTitleMatch = b.title && new RegExp(query, 'i').test(b.title);
      
      const aCategoryMatch = a.categories && a.categories.some(cat => new RegExp(query, 'i').test(cat));
      const bCategoryMatch = b.categories && b.categories.some(cat => new RegExp(query, 'i').test(cat));
      
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      if (aCategoryMatch && !bCategoryMatch) return -1;
      if (!aCategoryMatch && bCategoryMatch) return 1;
      
      return 0;
    });
    
    displayResults(results.slice(0, 8));
  }
  
  // Display results
  function displayResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
      searchResults.style.display = 'block';
      return;
    }
    
    searchResults.innerHTML = results.map(result => {
      let highlightedTitle = result.title;
      if (searchInput.value.length >= 2) {
        const regex = new RegExp(searchInput.value, 'gi');
        highlightedTitle = result.title.replace(regex, match => `<span class="search-highlight">${match}</span>`);
      }
      
      return `
        <a href="${result.url}" class="search-result-item">
          <div class="search-result-title">${highlightedTitle}</div>
          ${result.categories ? `<div class="search-result-category">${result.categories.join(', ')}</div>` : ''}
          <div class="search-result-excerpt">${result.excerpt ? result.excerpt.substring(0, 100) + '...' : ''}</div>
        </a>
      `;
    }).join('');
    
    searchResults.style.display = 'block';
  }
  
  // Handle search form submission (redirect to search results page)
  function handleSearchSubmit(query) {
    if (query.length > 0) {
      window.location.href = `/search/?q=${encodeURIComponent(query)}`;
    }
  }
  
  // Debounce search
  let searchTimeout;
  function debouncedSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  }
  
  // Event listeners for search
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    debouncedSearch(query);
  });
  
  searchInput.addEventListener('focus', function() {
    if (searchInput.value.length >= 2) {
      searchResults.style.display = 'block';
    }
  });
  
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      searchResults.style.display = 'none';
      searchInput.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(searchInput.value.trim());
    }
  });
  
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
  
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstResult = searchResults.querySelector('a');
      if (firstResult) {
        searchResults.style.display = 'block';
        firstResult.focus();
      }
    }
  });
  
  searchResults.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = e.target.nextElementSibling || searchResults.querySelector('a');
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.target.previousElementSibling) {
        e.target.previousElementSibling.focus();
      } else {
        searchInput.focus();
      }
    } else if (e.key === 'Escape') {
      searchResults.style.display = 'none';
      searchInput.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.target.click();
    }
  });
});

// Search results page functionality
if (window.location.pathname === '/search/') {
  document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
      const searchResultsContainer = document.getElementById('search-results-list');
      const searchQueryElement = document.getElementById('search-query');
      
      if (searchQueryElement) {
        searchQueryElement.textContent = query;
      }
      
      fetch('/search.json')
        .then(response => response.json())
        .then(searchIndex => {
          const results = searchIndex.filter(item => {
            const regex = new RegExp(query, 'i');
            return (
              (item.title && regex.test(item.title)) ||
              (item.content && regex.test(item.content)) ||
              (item.categories && item.categories.some(cat => regex.test(cat))) ||
              (item.tags && item.tags.some(tag => regex.test(tag)))
            );
          });
          
          if (searchResultsContainer) {
            if (results.length > 0) {
              searchResultsContainer.innerHTML = results.map(result => `
                <div class="search-result-item">
                  <h2><a href="${result.url}">${result.title}</a></h2>
                  <div class="search-result-meta">
                    ${result.date ? new Date(result.date).toLocaleDateString() : ''}
                    ${result.categories ? ` • ${result.categories.join(', ')}` : ''}
                  </div>
                  <div class="search-result-excerpt">${result.excerpt || ''}</div>
                  <a href="${result.url}" class="read-more">Read More</a>
                </div>
              `).join('');
            } else {
              searchResultsContainer.innerHTML = `
                <div class="no-results">
                  <h2>No results found for "${query}"</h2>
                  <p>Try different keywords or browse our categories</p>
                  <a href="/" class="btn btn-primary">Return to Homepage</a>
                </div>
              `;
            }
          }
        })
        .catch(error => {
          console.error('Error loading search results:', error);
          if (searchResultsContainer) {
            searchResultsContainer.innerHTML = `
              <div class="no-results">
                <h2>Error loading search results</h2>
                <p>Please try again later</p>
              </div>
            `;
          }
        });
    }
  });
}

// Simplified mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const menuOverlay = document.querySelector('.menu-overlay');
  const body = document.body;

  if (!menuToggle || !mainNav || !menuOverlay) return;

  menuToggle.addEventListener('click', function() {
    mainNav.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    body.classList.toggle('menu-open');
    
    const icon = menuToggle.querySelector('i');
    if (mainNav.classList.contains('active')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });

  // Close menu when clicking overlay
  menuOverlay.addEventListener('click', function() {
    mainNav.classList.remove('active');
    menuOverlay.classList.remove('active');
    body.classList.remove('menu-open');
    
    const icon = menuToggle.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
  });

  // Prevent menu from closing when clicking on menu items
  const menuItems = document.querySelectorAll('.main-nav a');
  menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      if (!this.parentElement.classList.contains('dropdown-toggle')) {
        e.stopPropagation();
      }
    });
  });
});
