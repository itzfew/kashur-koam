// Load all posts from _posts/*.json
async function fetchAllPosts() {
    try {
        // Fetch list of JSON files in _posts
        const postsDir = await fetch('_posts/');
        if (!postsDir.ok) {
            throw new Error("Could not fetch _posts/");
        }

        // Parse HTML response to find JSON files
        const html = await postsDir.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a[href$=".json"]'));
        const postFiles = links.map(link => link.getAttribute('href'));

        // Load each post
        const posts = [];
        for (const file of postFiles) {
            const response = await fetch(`_posts/${file}`);
            if (response.ok) {
                const post = await response.json();
                posts.push(post);
            }
        }

        return posts;
    } catch (error) {
        console.error("Error loading posts:", error);
        return [];
    }
}

// Display recent posts
async function loadRecentPosts() {
    const posts = await fetchAllPosts();
    const sorted = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentPosts = sorted.slice(0, 4);

    const container = document.getElementById('recent-posts-container');
    if (container) {
        container.innerHTML = recentPosts.map(post => createPostCard(post)).join('');
    }
}

// Display lengthy posts
async function loadFeaturedPosts() {
    const posts = await fetchAllPosts();
    const sorted = posts.sort((a, b) => b.content.length - a.content.length);
    const featuredPosts = sorted.slice(0, 3);

    const container = document.getElementById('featured-posts-container');
    if (container) {
        container.innerHTML = featuredPosts.map(post => createPostCard(post)).join('');
    }
}

// Create HTML for a post card
function createPostCard(post) {
    const excerpt = post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content;
    const date = new Date(post.date).toLocaleDateString();

    return `
        <div class="post-card">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">
                <span>${date}</span> | 
                <a href="author.html?name=${encodeURIComponent(post.author)}" class="author-link">
                    <i class="fas fa-user"></i> ${post.author}
                </a>
            </div>
            <p class="post-excerpt">${excerpt}</p>
            <a href="post.html?title=${encodeURIComponent(post.title)}" class="read-more">Read More</a>
        </div>
    `;
}

// Load everything when page opens
document.addEventListener('DOMContentLoaded', () => {
    loadRecentPosts();
    loadFeaturedPosts();
    // (Add district/school loading if needed)
});
