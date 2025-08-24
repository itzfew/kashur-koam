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
      const titleMatch = item.title && item.title.toLowerCase().includes(query);
      const contentMatch = item.content && item.content.toLowerCase().includes(query);
      const categoryMatch = item.categories && item.categories.some(cat => 
        cat.toLowerCase().includes(query)
      );
      
      return titleMatch || contentMatch || categoryMatch;
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
    
    searchResults.innerHTML = results.map(result => `
      <a href="${result.url}" class="search-result-item">
        <div class="search-result-title">${result.title}</div>
        ${result.categories ? `<div class="search-result-category">${result.categories.join(', ')}</div>` : ''}
      </a>
    `).join('');
    
    searchResults.style.display = 'block';
  }
  
  // Event listeners
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    performSearch(query);
  });
  
  searchInput.addEventListener('focus', function() {
    if (searchInput.value.length >= 2) {
      searchResults.style.display = 'block';
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
      if (firstResult) firstResult.focus();
    }
  });
  
  searchResults.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = e.target.nextElementSibling || searchResults.querySelector('a');
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = e.target.previousElementSibling || searchInput;
      prev.focus();
    }
  });
});
