document.addEventListener('DOMContentLoaded', function() {
    // Load all posts
    fetchAllPosts()
        .then(posts => {
            displayRecentPosts(posts);
            displayFeaturedPosts(posts);
            extractAndDisplayDistricts(posts);
            extractAndDisplaySchools(posts);
        })
        .catch(error => {
            console.error('Error loading posts:', error);
        });
});

// Fetch all posts from _posts directory
async function fetchAllPosts() {
    try {
        const response = await fetch('_posts/index.json');
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

// Display 4 most recent posts
function displayRecentPosts(posts) {
    const recentPostsContainer = document.getElementById('recent-posts-container');
    if (!recentPostsContainer) return;

    // Sort by date (newest first)
    const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentPosts = sortedPosts.slice(0, 4);

    recentPostsContainer.innerHTML = recentPosts.map(post => createPostCard(post)).join('');
}

// Display 3 most lengthy posts
function displayFeaturedPosts(posts) {
    const featuredPostsContainer = document.getElementById('featured-posts-container');
    if (!featuredPostsContainer) return;

    // Sort by content length (longest first)
    const sortedPosts = [...posts].sort((a, b) => b.content.length - a.content.length);
    const featuredPosts = sortedPosts.slice(0, 3);

    featuredPostsContainer.innerHTML = featuredPosts.map(post => createPostCard(post)).join('');
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

// Extract and display districts from posts
function extractAndDisplayDistricts(posts) {
    const districtsContainer = document.getElementById('districts-grid');
    if (!districtsContainer) return;

    // Get unique districts from posts
    const districts = [...new Set(posts
        .filter(post => post.type === 'village' || post.type === 'school')
        .map(post => post.district)
        .filter(Boolean)
    )];

    if (districts.length === 0) {
        districtsContainer.innerHTML = '<p>No districts found.</p>';
        return;
    }

    districtsContainer.innerHTML = districts.map(district => `
        <div class="district-card">
            <a href="search.html?label=${encodeURIComponent(district)}">${district}</a>
        </div>
    `).join('');
}

// Extract and display schools grouped by district
function extractAndDisplaySchools(posts) {
    const schoolsContainer = document.getElementById('schools-container');
    if (!schoolsContainer) return;

    // Filter school posts and group by district
    const schoolPosts = posts.filter(post => post.type === 'school' && post.district);
    const schoolsByDistrict = {};

    schoolPosts.forEach(post => {
        if (!schoolsByDistrict[post.district]) {
            schoolsByDistrict[post.district] = [];
        }
        schoolsByDistrict[post.district].push(post);
    });

    if (Object.keys(schoolsByDistrict).length === 0) {
        schoolsContainer.innerHTML = '<p>No schools found.</p>';
        return;
    }

    // Create HTML for each district's schools
    schoolsContainer.innerHTML = Object.entries(schoolsByDistrict).map(([district, schools]) => `
        <div class="school-district">
            <h3>${district}</h3>
            <div class="schools-list">
                ${schools.map(school => `
                    <div class="school-card">
                        <a href="search.html?label=school_${encodeURIComponent(district)}">
                            ${school.title}
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}
