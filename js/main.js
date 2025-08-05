async function fetchPosts() {
    const response = await fetch('_posts/');
    const files = await response.json(); // Note: GitHub Pages may require a custom endpoint or static list
    const posts = [];
    for (const file of files) {
        if (file.endsWith('.md')) {
            const postResponse = await fetch(`_posts/${file}`);
            const text = await postResponse.text();
            const frontMatterMatch = text.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
            if (frontMatterMatch) {
                const frontMatter = frontMatterMatch[1].split('\n').reduce((acc, line) => {
                    const [key, value] = line.split(':').map(s => s.trim());
                    if (key && value) acc[key] = value;
                    return acc;
                }, {});
                posts.push({ ...frontMatter, content: frontMatterMatch[2], file });
            }
        }
    }
    return posts;
}

function parseDate(dateStr) {
    return new Date(dateStr);
}

function truncateText(text, maxLength = 100) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function renderPosts(posts, containerId, limit = null) {
    const container = document.getElementById(containerId);
    const sortedPosts = posts.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    const displayPosts = limit ? sortedPosts.slice(0, limit) : sortedPosts;
    container.innerHTML = displayPosts.map(post => `
        <div class="post">
            <h3><a href="post.html?title=${encodeURIComponent(post.title)}">${post.title}</a></h3>
            <p class="post-preview">${truncateText(post.description)}</p>
            <p><small>${post.date}</small></p>
            <p class="author">
                <i class="fa fa-user"></i>
                <a href="author.html?name=${encodeURIComponent(post.author)}">${post.author}</a>
            </p>
        </div>
    `).join('');
}

function renderDistricts(posts) {
    const districts = [...new Set(posts.filter(p => p.type === 'district').map(p => p.title))];
    const container = document.getElementById('districts');
    container.innerHTML = districts.map(district => `
        <div class="district">
            <h3><a href="search.html?label=${encodeURIComponent(district)}">${district}</a></h3>
        </div>
    `).join('');
}

function renderSchools(posts) {
    const schoolsByDistrict = posts.filter(p => p.type === 'school').reduce((acc, post) => {
        acc[post.district] = acc[post.district] || [];
        acc[post.district].push(post);
        return acc;
    }, {});
    const container = document.getElementById('schools');
    container.innerHTML = Object.entries(schoolsByDistrict).map(([district, schools]) => `
        <div class="school">
            <h3><a href="search.html?label=school_${encodeURIComponent(district)}">${district}</a></h3>
            <p>${schools.length} schools</p>
        </div>
    `).join('');
}

async function init() {
    const posts = await fetchPosts();
    renderPosts(posts, 'recent-posts', 4);
    const longestPosts = posts.sort((a, b) => b.description.length - a.description.length);
    renderPosts(longestPosts, 'longest-posts', 3);
    renderDistricts(posts);
    renderSchools(posts);
}

document.addEventListener('DOMContentLoaded', init);
