// Load posts from /posts/1.json, /posts/2.json, etc.
async function loadPosts() {
  const postsContainer = document.getElementById('posts-container');
  if (!postsContainer) return;

  postsContainer.innerHTML = '<p>Loading posts...</p>';

  let posts = [];
  let postNumber = 1;

  // Keep loading until we hit a 404
  while (true) {
    try {
      const response = await fetch(`/posts/${postNumber}.json`);
      if (!response.ok) break;  // Stop if no more posts
      const post = await response.json();
      posts.push(post);
      postNumber++;
    } catch (error) {
      console.error(`Error loading post ${postNumber}:`, error);
      break;
    }
  }

  // Display posts
  if (posts.length === 0) {
    postsContainer.innerHTML = '<p>No posts found.</p>';
  } else {
    postsContainer.innerHTML = posts.map(post => `
      <div class="post">
        <h3>${post.title}</h3>
        <small>${post.date} • ${post.author}</small>
        <p>${post.content.slice(0, 100)}...</p>
        <a href="/post.html?id=${postNumber - 1}">Read more</a>
      </div>
    `).join('');
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', loadPosts);
