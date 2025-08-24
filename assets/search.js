// Enhanced client-side search
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
      // Escape special regex characters in query
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      
      const titleMatch = item.title && regex.test(item.title);
      const contentMatch = item.content && regex.test(item.content);
      const categoryMatch = item.categories && item.categories.some(cat => 
        regex.test(cat)
      );
      const tagsMatch = item.tags && item.tags.some(tag => 
        regex.test(tag)
      );
      
      return titleMatch || contentMatch || categoryMatch || tagsMatch;
    });
    
    // Sort by relevance (title matches first, then category, then content)
    results.sort((a, b) => {
      const aTitleMatch = a.title && new RegExp(query, 'i').test(a.title);
      const bTitleMatch = b.title && new RegExp(query, 'i').test(b.title);
      
      const aCategoryMatch = a.categories && a.categories.some(cat => 
        new RegExp(query, 'i').test(cat)
      );
      const bCategoryMatch = b.categories && b.categories.some(cat => 
        new RegExp(query, 'i').test(cat)
      );
      
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
      // Highlight matching text in title
      let highlightedTitle = result.title;
      if (searchInput.value.length >= 2) {
        const regex = new RegExp(searchInput.value, 'gi');
        highlightedTitle = result.title.replace(regex, match => 
          `<span class="search-highlight">${match}</span>`
        );
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
  
  // Debounce search to improve performance
  let searchTimeout;
  function debouncedSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  }
  
  // Event listeners
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
    }
  });
  
  // Hide results when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
  
  // Keyboard navigation
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
    }
  });
  
  // Mobile menu functionality
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      mainNav.classList.toggle('active');
      
      // Change icon based on menu state
      const icon = this.querySelector('i');
      if (mainNav.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
        document.addEventListener('click', closeMobileMenu);
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        document.removeEventListener('click', closeMobileMenu);
      }
    });
    
    // Prevent clicks inside nav from closing it
    mainNav.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Close mobile menu when clicking outside
    function closeMobileMenu(e) {
      if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        mainNav.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        document.removeEventListener('click', closeMobileMenu);
      }
    }
    
    // Handle dropdowns in mobile view
    const dropdownToggles = mainNav.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const dropdown = this.parentElement;
          dropdown.classList.toggle('active');
          
          // Close other dropdowns
          dropdownToggles.forEach(otherToggle => {
            if (otherToggle !== toggle) {
              otherToggle.parentElement.classList.remove('active');
            }
          });
        }
      });
    });
  }
  
  // Close dropdowns when clicking outside (desktop)
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown') && window.innerWidth > 768) {
      document.querySelectorAll('.dropdown-content').forEach(function(dropdown) {
        dropdown.style.display = 'none';
      });
    }
    
    // Handle dropdown hover for desktop
    if (window.innerWidth > 768) {
      const dropdowns = document.querySelectorAll('.dropdown');
      dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
          this.querySelector('.dropdown-content').style.display = 'block';
        });
        
        dropdown.addEventListener('mouseleave', function() {
          this.querySelector('.dropdown-content').style.display = 'none';
        });
      });
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    // Close mobile menu when resizing to desktop
    if (window.innerWidth > 768 && mainNav) {
      mainNav.classList.remove('active');
      if (mobileMenuToggle) {
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    }
    
    // Reset dropdowns on resize
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
    
    // Ensure dropdown content is visible on desktop
    if (window.innerWidth > 768) {
      document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        dropdown.style.display = 'none';
      });
    }
  });
});
