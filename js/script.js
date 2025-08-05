document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Load all posts
    fetchPosts();
});

async function fetchPosts() {
    try {
        // Generate mock posts for all dates up to today
        const posts = generatePostsUpToToday();
        
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

function generatePostsUpToToday() {
    const posts = [];
    const today = new Date();
    const startDate = new Date(2023, 0, 1); // Start from Jan 1, 2023
    
    // Loop through each day from startDate to today
    for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
        // Generate 1-3 posts per day
        const postsPerDay = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 1; i <= postsPerDay; i++) {
            const postDate = new Date(date);
            const formattedDate = formatDateForFilename(postDate);
            const fileName = `posts/${formattedDate}-${i.toString().padStart(2, '0')}.json`;
            
            // Determine post type (random distribution)
            const postTypes = ['village', 'school', 'district', 'general'];
            const weights = [0.3, 0.3, 0.2, 0.2];
            const postType = weightedRandom(postTypes, weights);
            
            // Create post data
            const post = {
                title: generatePostTitle(postType, postDate, i),
                fileName: fileName,
                content: generatePostContent(postType),
                excerpt: '',
                type: postType,
                district: postType === 'village' || postType === 'school' ? 'District ' + String.fromCharCode(65 + Math.floor(Math.random() * 5)) : '',
                village: postType === 'village' ? 'Village ' + (Math.floor(Math.random() * 20) + 1) : '',
                school: postType === 'school' ? 'School ' + (Math.floor(Math.random() * 10) + 1) : '',
                date: postDate.toISOString(),
                author: 'Author ' + (Math.floor(Math.random() * 5) + 1)
            };
            
            // Generate excerpt (first 200 chars of content)
            post.excerpt = post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '');
            
            posts.push(post);
        }
    }
    
    return posts;
}

function formatDateForFilename(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function weightedRandom(items, weights) {
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let weightSum = 0;

    for (let i = 0; i < items.length; i++) {
        weightSum += weights[i];
        if (random <= weightSum) return items[i];
    }
}

function generatePostTitle(type, date, index) {
    const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const types = {
        village: `Village Update - ${dateStr}`,
        school: `School Report - ${dateStr}`,
        district: `District News - ${dateStr}`,
        general: `Community Bulletin - ${dateStr}`
    };
    return types[type] || `Post ${index} - ${dateStr}`;
}

function generatePostContent(type) {
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ";
    const villageContent = "The village has seen significant improvements in infrastructure this month. New roads have been paved and the community center renovation is nearly complete. Local farmers report excellent harvests this season. ";
    const schoolContent = "The school has announced new extracurricular programs starting next semester. Test scores have improved by 15% compared to last year. A new computer lab has been installed with 30 workstations. ";
    const districtContent = "The district council has approved the new budget for public services. Road construction projects are scheduled to begin next month. Public hearings will be held regarding the new zoning regulations. ";
    
    const contents = {
        village: villageContent + lorem.repeat(3),
        school: schoolContent + lorem.repeat(4),
        district: districtContent + lorem.repeat(2),
        general: lorem.repeat(5)
    };
    
    return contents[type] || lorem.repeat(4);
}

// Rest of the functions (displayRecentPosts, displayLengthyPosts, etc.) remain the same as in the previous implementation
