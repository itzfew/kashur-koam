async function fetchAllPosts() {
    let posts = [];
    let postNumber = 1;

    while (true) {
        try {
            const response = await fetch(`/posts/${postNumber}.json`);
            if (!response.ok) break;
            const post = await response.json();
            posts.push(post);
            postNumber++;
        } catch (error) {
            console.error(`Error loading post ${postNumber}:`, error);
            break;
        }
    }

    // Sort posts by date in descending order (most recent first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    return posts;
}

function createPostCard(post) {
    const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const previewContent = post.content.length > 100 ? 
        post.content.slice(0, 100) + '...' : 
        post.content;

    return `
        <div class="post-card">
            <h3><a href="/pages/post.html?title=${encodeURIComponent(post.title)}">${post.title}</a></h3>
            <div class="post-meta">
                <span>${date}</span> | 
                <a href="/pages/author.html?name=${encodeURIComponent(post.author)}" class="author-link">
                    <i class="fas fa-user"></i> ${post.author}
                </a>
                ${post.type ? `| <span>${post.type}</span>` : ''}
                ${post.district ? `| <span>${post.district}</span>` : ''}
                ${post.village ? `| <span>${post.village}</span>` : ''}
            </div>
            <p>${previewContent}</p>
        </div>
    `;
}
