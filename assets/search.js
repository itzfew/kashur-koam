// Enhanced client-side search without search.json
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  
  let searchIndex = [];
  let searchResults = document.getElementById('search-results');
  let isIndexing = false;
  
  // Create search results container if it doesn't exist
  if (!searchResults) {
    searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    searchResults.className = 'search-results';
    searchInput.parentNode.appendChild(searchResults);
  }
  
  // Function to index all articles on the site
  async function buildSearchIndex() {
    if (isIndexing) return;
    isIndexing = true;
    
    // Show loading indicator
    searchResults.innerHTML = '<div class="search-result-item">Indexing content...</div>';
    searchResults.style.display = 'block';
    
    try {
      // First, try to get list of posts from the sitemap or API
      let posts = [];
      
      // Method 1: Try to fetch from sitemap.xml
      try {
        const sitemapResponse = await fetch('/sitemap.xml');
        if (sitemapResponse.ok) {
          const sitemapText = await sitemapResponse.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(sitemapText, "text/xml");
          const urls = xmlDoc.getElementsByTagName("url");
          
          for (let i = 0; i < urls.length; i++) {
            const loc = urls[i].getElementsByTagName("loc")[0];
            if (loc && loc.textContent) {
              const url = loc.textContent;
              // Only index post pages (adjust this pattern as needed)
              if (url.includes('/20') || url.match(/\/(\d{4})\/(\d{2})\/(\d{2})/)) {
                posts.push(url);
              }
            }
          }
        }
      } catch (e) {
        console.log('Sitemap not available, using alternative method');
      }
      
      // Method 2: If sitemap fails, try to find posts by scanning page links
      if (posts.length === 0) {
        const allLinks = document.querySelectorAll('a[href]');
        const postLinks = new Set();
        
        allLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href && (href.includes('/20') || href.match(/\/(\d{4})\/(\d{2})\/(\d{2})/))) {
            // Convert to absolute URL if relative
            const absoluteUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
            postLinks.add(absoluteUrl);
          }
        });
        
        posts = Array.from(postLinks);
      }
      
      // Method 3: If still no posts, use the current page's posts (for home page)
      if (posts.length === 0) {
        const postPreviews = document.querySelectorAll('.post-preview, article');
        postPreviews.forEach(post => {
          const link = post.querySelector('a[href]');
          if (link) {
            const href = link.getAttribute('href');
            const absoluteUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
            posts.push(absoluteUrl);
          }
        });
      }
      
      // Index each post
      searchIndex = [];
      const indexingPromises = posts.map(async (postUrl) => {
        try {
          // Skip if already indexed
          if (searchIndex.some(item => item.url === postUrl)) return;
          
          // Fetch the post content
          const response = await fetch(postUrl);
          if (!response.ok) return;
          
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          
          // Extract post data
          const title = doc.querySelector('h1, .post-title, .post-full h1, title')?.textContent || '';
          const content = doc.querySelector('.content, .post-content, article')?.textContent || '';
          const excerpt = doc.querySelector('.excerpt, .post-excerpt, meta[name="description"]')?.content || 
                          content.substring(0, 200) + '...';
          
          // Extract categories
          const categories = [];
          const categoryLinks = doc.querySelectorAll('.meta a[href*="/categories/"], .post-categories a');
          categoryLinks.forEach(link => {
            const category = link.textContent.trim();
            if (category && !categories.includes(category)) {
              categories.push(category);
            }
          });
          
          // Extract date
          let date = '';
          const dateElement = doc.querySelector('.meta time, .post-date, [datetime]');
          if (dateElement) {
            date = dateElement.getAttribute('datetime') || dateElement.textContent;
          }
          
          // Add to index
          searchIndex.push({
            url: postUrl,
            title: title.trim(),
            content: content.trim(),
            excerpt: excerpt.trim(),
            categories: categories,
            date: date
          });
        } catch (error) {
          console.error('Error indexing:', postUrl, error);
        }
      });
      
      await Promise.all(indexingPromises);
      
      // Store index in localStorage for future use
      try {
        localStorage.setItem('searchIndex', JSON.stringify({
          data: searchIndex,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('LocalStorage not available');
      }
      
    } catch (error) {
      console.error('Error building search index:', error);
      searchResults.innerHTML = '<div class="search-result-item">Error loading search. Please refresh the page.</div>';
    }
    
    isIndexing = false;
  }
  
  // Try to load search index from localStorage first
  function loadSearchIndexFromStorage() {
    try {
      const stored = localStorage.getItem('searchIndex');
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        // Use stored index if it's less than 1 hour old
        if (data && timestamp && (Date.now() - timestamp < 60 * 60 * 1000)) {
          searchIndex = data;
          return true;
        }
      }
    } catch (e) {
      console.log('Cannot load from localStorage');
    }
    return false;
  }
  
  // Initialize search
  if (!loadSearchIndexFromStorage()) {
    // Build index when user focuses on search or after a short delay
    let indexBuilt = false;
    
    const buildIndexWhenNeeded = () => {
      if (!indexBuilt) {
        indexBuilt = true;
        buildSearchIndex();
      }
    };
    
    searchInput.addEventListener('focus', buildIndexWhenNeeded);
    setTimeout(buildIndexWhenNeeded, 2000); // Build index after 2 seconds
  }
  
  // Search function
  function performSearch(query) {
    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }
    
    if (searchIndex.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item">Search index not ready yet. Please try again.</div>';
      searchResults.style.display = 'block';
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
      
      return titleMatch || contentMatch || categoryMatch;
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
          ${result.categories && result.categories.length > 0 ? 
            `<div class="search-result-category">${result.categories.join(', ')}</div>` : ''}
          <div class="search-result-excerpt">${result.excerpt.substring(0, 100)}...</div>
        </a>
      `;
    }).join('');
    
    searchResults.style.display = 'block';
  }
  
  // Handle search form submission (redirect to search results page)
  function handleSearchSubmit(query) {
    if (query.length > 0) {
      // Store query for results page
      sessionStorage.setItem('searchQuery', query);
      // Redirect to search results page
      window.location.href = `/search/?q=${encodeURIComponent(query)}`;
    }
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
    if (searchInput.value.length >= 2 && searchIndex.length > 0) {
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.target.click();
    }
  });
  
  // Mobile side menu functionality
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const body = document.body;
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  document.body.appendChild(overlay);

  if (mobileMenuToggle && mainNav) {
    // Toggle menu function
    function toggleMenu() {
      mainNav.classList.toggle('active');
      overlay.classList.toggle('active');
      body.classList.toggle('menu-open');
      
      // Change icon based on menu state
      const icon = mobileMenuToggle.querySelector('i');
      if (mainNav.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
        mobileMenuToggle.classList.add('active');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        mobileMenuToggle.classList.remove('active');
      }
    }

    mobileMenuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', function() {
      toggleMenu();
    });

    // Close menu when clicking escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mainNav.classList.contains('active')) {
        toggleMenu();
      }
    });

    // Handle dropdowns in mobile view
    const dropdownToggles = mainNav.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();
          
          const dropdown = this.parentElement;
          const wasActive = dropdown.classList.contains('active');
          
          // Close all other dropdowns
          dropdownToggles.forEach(otherToggle => {
            if (otherToggle !== toggle) {
              otherToggle.parentElement.classList.remove('active');
            }
          });
          
          // Toggle current dropdown
          if (!wasActive) {
            dropdown.classList.add('active');
          } else {
            dropdown.classList.remove('active');
          }
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768 && mainNav.classList.contains('active')) {
        if (!e.target.closest('.dropdown') && !e.target.closest('.dropdown-toggle')) {
          dropdownToggles.forEach(toggle => {
            toggle.parentElement.classList.remove('active');
          });
        }
      }
    });
  }

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      // Close menu when resizing to desktop
      if (window.innerWidth > 768) {
        if (mainNav && mainNav.classList.contains('active')) {
          mainNav.classList.remove('active');
          overlay.classList.remove('active');
          body.classList.remove('menu-open');
          
          if (mobileMenuToggle) {
            const icon = mobileMenuToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            mobileMenuToggle.classList.remove('active');
          }
        }
        
        // Reset all dropdowns
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    }, 250);
  });
});

// Search results page functionality
if (window.location.pathname === '/search/') {
  document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || sessionStorage.getItem('searchQuery') || '';
    
    // Clear stored query
    sessionStorage.removeItem('searchQuery');
    
    if (query) {
      const searchResultsContainer = document.getElementById('search-results-list');
      const searchQueryElement = document.getElementById('search-query');
      
      if (searchQueryElement) {
        searchQueryElement.textContent = query;
      }
      
      // Try to load search index from localStorage
      let searchIndex = [];
      try {
        const stored = localStorage.getItem('searchIndex');
        if (stored) {
          const { data } = JSON.parse(stored);
          if (data) searchIndex = data;
        }
      } catch (e) {
        console.log('Cannot load from localStorage');
      }
      
      // If no index in storage, try to build it from current page
      if (searchIndex.length === 0) {
        const postPreviews = document.querySelectorAll('.post-preview, article');
        postPreviews.forEach(post => {
          const link = post.querySelector('a[href]');
          if (link) {
            const href = link.getAttribute('href');
            const absoluteUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
            
            const title = post.querySelector('h2, h3, .post-title')?.textContent || '';
            const excerpt = post.querySelector('.excerpt, .post-excerpt')?.textContent || '';
            
            // Extract categories
            const categories = [];
            const categoryLinks = post.querySelectorAll('.meta a[href*="/categories/"], .post-categories a');
            categoryLinks.forEach(catLink => {
              const category = catLink.textContent.trim();
              if (category && !categories.includes(category)) {
                categories.push(category);
              }
            });
            
            searchIndex.push({
              url: absoluteUrl,
              title: title.trim(),
              excerpt: excerpt.trim(),
              categories: categories
            });
          }
        });
      }
      
      if (searchResultsContainer) {
        if (searchIndex.length > 0) {
          const results = searchIndex.filter(item => {
            const regex = new RegExp(query, 'i');
            return (
              (item.title && regex.test(item.title)) ||
              (item.excerpt && regex.test(item.excerpt)) ||
              (item.categories && item.categories.some(cat => regex.test(cat)))
            );
          });
          
          if (results.length > 0) {
            searchResultsContainer.innerHTML = results.map(result => {
              // Highlight query in title
              let highlightedTitle = result.title;
              if (query.length >= 2) {
                const regex = new RegExp(query, 'gi');
                highlightedTitle = result.title.replace(regex, match => 
                  `<span class="search-highlight">${match}</span>`
                );
              }
              
              return `
                <div class="search-result-item">
                  <h2><a href="${result.url}">${highlightedTitle}</a></h2>
                  ${result.categories && result.categories.length > 0 ? 
                    `<div class="search-result-meta">${result.categories.join(', ')}</div>` : ''}
                  <div class="search-result-excerpt">
                    ${result.excerpt || ''}
                  </div>
                  <a href="${result.url}" class="read-more">Read More</a>
                </div>
              `;
            }).join('');
          } else {
            searchResultsContainer.innerHTML = `
              <div class="no-results">
                <h2>No results found for "${query}"</h2>
                <p>Try different keywords or browse our categories</p>
                <a href="/" class="btn btn-primary">Return to Homepage</a>
              </div>
            `;
          }
        } else {
          searchResultsContainer.innerHTML = `
            <div class="no-results">
              <h2>Search index not available</h2>
              <p>Please use the search box on the homepage to find content</p>
              <a href="/" class="btn btn-primary">Return to Homepage</a>
            </div>
          `;
        }
      }
    }
  });
}
