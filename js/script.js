document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('year').textContent = new Date().getFullYear();
    fetchPosts();
});

async function fetchPosts() {
    try {
        // Generate posts from today back to 2023
        const today = new Date();
        const posts = [];
        
        // Generate posts for last 2 years (adjust as needed)
        for (let d = new Date(today); d >= new Date(2023, 0, 1); d.setDate(d.getDate() - 1)) {
            const postsCount = Math.floor(Math.random() * 3) + 1; // 1-3 posts per day
            
            for (let i = 1; i <= postsCount; i++) {
                const postDate = new Date(d);
                const post = generatePost(postDate, i);
                posts.push(post);
            }
        }
        
        // Display content
        displayRecentPosts(posts.slice(0, 4));
        displayLengthyPosts([...posts].sort((a,b) => b.content.length - a.content.length).slice(0, 3));
        displayDistricts(posts);
        displaySchools(posts);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

function generatePost(date, index) {
    const types = ['village', 'school', 'district', 'general'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const districts = ['North District', 'South District', 'East District', 'West District', 'Central District'];
    const district = type !== 'general' ? districts[Math.floor(Math.random() * districts.length)] : '';
    
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Update ${date.toLocaleDateString()}`;
    const fileName = `${formatDateForFile(date)}-${index.toString().padStart(2, '0')}.json`;
    
    return {
        title: title,
        fileName: fileName,
        content: generateContent(type, district),
        excerpt: generateExcerpt(type),
        type: type,
        district: district,
        village: type === 'village' ? `Village ${Math.floor(Math.random() * 20) + 1}` : '',
        school: type === 'school' ? `${district} School ${Math.floor(Math.random() * 5) + 1}` : '',
        date: date.toISOString(),
        author: `Author ${Math.floor(Math.random() * 5) + 1}`
    };
}

function formatDateForFile(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function generateContent(type, district) {
    const base = `This is a ${type} post about ${district || 'general information'}. `;
    const specifics = {
        village: `The village has ${Math.floor(Math.random() * 5000) + 1000} residents and ${Math.floor(Math.random() * 5) + 1} schools. `,
        school: `The school serves ${Math.floor(Math.random() * 1000) + 200} students with ${Math.floor(Math.random() * 30) + 10} teachers. `,
        district: `The district covers ${Math.floor(Math.random() * 500) + 100} square kilometers with ${Math.floor(Math.random() * 20) + 5} villages. `,
        general: `This update contains important community information and announcements. `
    };
    
    return base + specifics[type] + ' '.repeat(100).split('').map(() => 
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ').join('');
}

function generateExcerpt(type) {
    return `This ${type} post contains important information about ` + 
           `${type === 'village' ? 'village life' : 
             type === 'school' ? 'education' : 
             type === 'district' ? 'district administration' : 'community matters'}.`;
}

function displayRecentPosts(posts) {
    const container = document.getElementById('recent-posts-container');
    container.innerHTML = posts.map(post => createPostCard(post)).join('');
}

function displayLengthyPosts(posts) {
    const container = document.getElementById('lengthy-posts-container');
    container.innerHTML = posts.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
    return `
        <div class="post-card">
            <span class="post-type ${post.type}">${post.type}</span>
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">
                <span>${new Date(post.date).toLocaleDateString()}</span>
                <span class="post-author" onclick="window.location='author?name=${encodeURIComponent(post.author)}'">
                    <i class="fas fa-user"></i> ${post.author}
                </span>
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="post?title=${encodeURIComponent(post.title)}" class="read-more">Read More</a>
        </div>
    `;
}

function displayDistricts(posts) {
    const districts = [...new Set(posts.filter(p => p.district).map(p => p.district))];
    const container = document.getElementById('districts-grid');
    container.innerHTML = districts.map(d => `
        <div class="district-card" onclick="window.location='search?label=${encodeURIComponent(d)}'">
            ${d}
        </div>
    `).join('');
}

function displaySchools(posts) {
    const schoolsByDistrict = {};
    posts.filter(p => p.type === 'school').forEach(p => {
        if (!schoolsByDistrict[p.district]) schoolsByDistrict[p.district] = new Set();
        schoolsByDistrict[p.district].add(p.school);
    });
    
    const container = document.getElementById('schools-container');
    container.innerHTML = Object.entries(schoolsByDistrict).map(([district, schools]) => `
        <h3>${district}</h3>
        <div class="grid-container">
            ${[...schools].map(s => `
                <div class="school-card" 
                     onclick="window.location='search?label=school_${encodeURIComponent(district)}_${encodeURIComponent(s)}'">
                    ${s}
                </div>
            `).join('')}
        </div>
    `).join('');
}
