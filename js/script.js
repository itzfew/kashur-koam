document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Load all posts
    fetchPosts();
});

async function fetchPosts() {
    try {
        const response = await fetch('_posts/');
        if (!response.ok) {
            throw new Error('Posts directory not found');
        }
        
        const fileNames = await response.json();
        const posts = [];
        
        for (const fileName of fileNames) {
            if (fileName.endsWith('.md')) {
                const postResponse = await fetch(`_posts/${fileName}`);
                const postContent = await postResponse.text();
                const post = parseMarkdownPost(postContent, fileName);
                posts.push(post);
            }
        }
        
        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display recent posts (4 most recent)
        displayRecentPosts(posts);
        
        // Display lengthy posts (3 with most characters)
        displayLengthyPosts(posts);
        
        // Display districts
        displayDistricts(posts);
        
        // Display schools
        displaySchools(posts);
        
        // Generate sitemap
        generateSitemap(posts);
        
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function parseMarkdownPost(content, fileName) {
    const lines = content.split('\n');
    const post = {
        title: fileName.replace('.md', '').replace(/_/g, ' '),
        fileName: fileName,
        content: '',
        excerpt: '',
        type: 'general',
        district: '',
        village: '',
        school: '',
        date: new Date().toISOString(),
        author: 'Unknown'
    };
    
    let inFrontMatter = false;
    let inContent = false;
    
    for (const line of lines) {
        if (line.trim() === '---') {
            if (!inFrontMatter) {
                inFrontMatter = true;
            } else {
                inFrontMatter = false;
                inContent = true;
            }
            continue;
        }
        
        if (inFrontMatter) {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex > -1) {
                const key = line.substring(0, separatorIndex).trim();
                const value = line.substring(separatorIndex + 1).trim();
                
                switch (key) {
                    case 'title':
                        post.title = value.replace(/"/g, '');
                        break;
                    case 'date':
                        post.date = value;
                        break;
                    case 'type':
                        post.type = value.toLowerCase();
                        break;
                    case 'district':
                        post.district = value.replace(/"/g, '');
                        break;
                    case 'village':
                        post.village = value.replace(/"/g, '');
                        break;
                    case 'school':
                        post.school = value.replace(/"/g, '');
                        break;
                    case 'author':
                        post.author = value.replace(/"/g, '');
                        break;
                }
            }
        }
        
        if (inContent) {
            post.content += line + '\n';
            
            // Create excerpt (first 200 characters)
            if (post.excerpt.length < 200 && line.trim().length > 0) {
                post.excerpt += line.trim() + ' ';
                if (post.excerpt.length > 200) {
                    post.excerpt = post.excerpt.substring(0, 200) + '...';
                }
            }
        }
    }
    
    return post;
}

function displayRecentPosts(posts) {
    const recentPostsContainer = document.getElementById('recent-posts-container');
    const recentPosts = posts.slice(0, 4);
    
    recentPostsContainer.innerHTML = recentPosts.map(post => createPostCard(post)).join('');
    
    // Add event listeners to author links
    addAuthorEventListeners();
}

function displayLengthyPosts(posts) {
    const lengthyPostsContainer = document.getElementById('lengthy-posts-container');
    
    // Sort posts by content length (descending)
    const sortedByLength = [...posts].sort((a, b) => b.content.length - a.content.length);
    const lengthyPosts = sortedByLength.slice(0, 3);
    
    lengthyPostsContainer.innerHTML = lengthyPosts.map(post => createPostCard(post)).join('');
    
    // Add event listeners to author links
    addAuthorEventListeners();
}

function displayDistricts(posts) {
    const districtsContainer = document.getElementById('districts-grid');
    
    // Get unique districts from posts
    const districts = new Set();
    posts.forEach(post => {
        if (post.district) {
            districts.add(post.district);
        }
    });
    
    if (districts.size === 0) {
        districtsContainer.innerHTML = '<p>No districts found in posts.</p>';
        return;
    }
    
    districtsContainer.innerHTML = Array.from(districts).map(district => `
        <div class="district-card" onclick="window.location.href='search?label=${encodeURIComponent(district)}'">
            ${district}
        </div>
    `).join('');
}

function displaySchools(posts) {
    const schoolsContainer = document.getElementById('schools-container');
    
    // Group schools by district
    const schoolsByDistrict = {};
    posts.forEach(post => {
        if (post.type === 'school' && post.district) {
            if (!schoolsByDistrict[post.district]) {
                schoolsByDistrict[post.district] = new Set();
            }
            schoolsByDistrict[post.district].add(post.school || post.title);
        }
    });
    
    if (Object.keys(schoolsByDistrict).length === 0) {
        schoolsContainer.innerHTML = '<p>No schools found in posts.</p>';
        return;
    }
    
    let html = '';
    for (const district in schoolsByDistrict) {
        html += `
            <h3>${district}</h3>
            <div class="grid-container">
                ${Array.from(schoolsByDistrict[district]).map(school => `
                    <div class="school-card" onclick="window.location.href='search?label=school_${encodeURIComponent(district)}_${encodeURIComponent(school)}'">
                        ${school}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    schoolsContainer.innerHTML = html;
}

function createPostCard(post) {
    return `
        <div class="post-card">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">
                <span>${formatDate(post.date)}</span>
                <span class="post-author" onclick="window.location.href='author?name=${encodeURIComponent(post.author)}'">
                    <i class="fas fa-user"></i> ${post.author}
                </span>
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="post?title=${encodeURIComponent(post.title)}" class="read-more">Read More</a>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function addAuthorEventListeners() {
    document.querySelectorAll('.post-author').forEach(authorLink => {
        authorLink.addEventListener('click', function(e) {
            e.preventDefault();
            const authorName = this.textContent.trim();
            window.location.href = `author?name=${encodeURIComponent(authorName)}`;
        });
    });
}

function generateSitemap(posts) {
    const sitemap = {
        pages: [
            { url: '/', lastmod: new Date().toISOString() },
            { url: '/privacy-policy.html', lastmod: new Date().toISOString() },
            { url: '/terms-and-conditions.html', lastmod: new Date().toISOString() },
            { url: '/contact.html', lastmod: new Date().toISOString() }
        ],
        posts: posts.map(post => ({
            url: `/post?title=${encodeURIComponent(post.title)}`,
            lastmod: post.date
        }))
    };
    
    // In a real implementation, you would save this to sitemap.xml
    console.log('Sitemap generated:', sitemap);
}
