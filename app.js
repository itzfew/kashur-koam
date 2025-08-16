function checkLogin() {
    const username = localStorage.getItem('username');
    const name = localStorage.getItem('name');
    if (username) {
        const profile = document.getElementById('user-profile');
        profile.innerHTML = name.charAt(0).toUpperCase();
        profile.title = username;
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const response = await fetch(`${SCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', username);
        localStorage.setItem('name', data.name);
        window.location.href = 'index.html';
    } else {
        alert('Login failed');
    }
}

async function signup() {
    const name = document.getElementById('name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const response = await fetch(`${SCRIPT_URL}?action=signup&name=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', username);
        localStorage.setItem('name', name);
        window.location.href = 'index.html';
    } else {
        alert('Signup failed: ' + data.message);
    }
}

async function loadCategories() {
    const response = await fetch(`${SCRIPT_URL}?action=getCategories`);
    const categories = await response.json();
    const list = document.getElementById('category-list');
    const select = document.getElementById('category');
    if (list) {
        list.innerHTML = '';
        categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" onclick="loadArticlesByCategory('${category.name}')">${category.name}</a>`;
            list.appendChild(li);
        });
    }
    if (select) {
        select.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }
}

async function loadLatestArticles() {
    const response = await fetch(`${SCRIPT_URL}?action=getLatestArticles`);
    const articles = await response.json();
    const list = document.getElementById('latest-list');
    list.innerHTML = '';
    articles.forEach(article => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="article.html?slug=${encodeURIComponent(article.slug)}">${article.title}</a>`;
        list.appendChild(li);
    });
}

async function loadArticlesByCategory(category) {
    const response = await fetch(`${SCRIPT_URL}?action=getArticlesByCategory&category=${encodeURIComponent(category)}`);
    const articles = await response.json();
    alert(articles.map(a => a.title).join('\n'));
}

async function searchArticles() {
    const query = document.getElementById('search-bar').value;
    const response = await fetch(`${SCRIPT_URL}?action=searchArticles&query=${encodeURIComponent(query)}`);
    const articles = await response.json();
    alert(articles.map(a => a.title).join('\n'));
}

async function loadArticle(slug) {
    const response = await fetch(`${SCRIPT_URL}?action=getArticle&slug=${encodeURIComponent(slug)}`);
    const article = await response.json();
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-categories').textContent = article.categories.join(', ');
    const content = article.contentText.replace(/\[\[([^\]]+)\]\]/g, '<a href="article.html?slug=$1">$1</a>');
    const infoboxMatch = content.match(/{{Infobox(.*?)}}/s);
    if (infoboxMatch) {
        document.getElementById('infobox').innerHTML = parseInfobox(infoboxMatch[1]);
    }
    document.getElementById('article-content').innerHTML = content.replace(/{{Infobox(.*?)}}/s, '');
}

function parseInfobox(content) {
    const lines = content.split('|');
    let html = '<table>';
    lines.forEach(line => {
        if (line.includes('=')) {
            const [key, value] = line.split('=');
            html += `<tr><th>${key.trim()}</th><td>${value.trim()}</td></tr>`;
        }
    });
    html += '</table>';
    return html;
}

async function loadArticleForEdit(slug) {
    const response = await fetch(`${SCRIPT_URL}?action=getArticle&slug=${encodeURIComponent(slug)}`);
    const article = await response.json();
    document.getElementById('title').value = article.title;
    document.getElementById('content').value = article.contentText;
    const select = document.getElementById('category');
    Array.from(select.options).forEach(option => {
        option.selected = article.categories.includes(option.value);
    });
}

async function loadEditHistory(slug) {
    const response = await fetch(`${SCRIPT_URL}?action=getEditHistory&slug=${encodeURIComponent(slug)}`);
    const history = await response.json();
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    history.forEach(edit => {
        const li = document.createElement('li');
        li.textContent = `${edit.createdAt} by ${edit.editorId}: ${edit.summary}`;
        list.appendChild(li);
    });
}

async function loadComments(slug) {
    const response = await fetch(`${SCRIPT_URL}?action=getComments&slug=${encodeURIComponent(slug)}`);
    const comments = await response.json();
    const list = document.getElementById('comments-list');
    list.innerHTML = '';
    comments.forEach(comment => {
        const li = document.createElement('li');
        li.textContent = `${comment.createdAt} by ${comment.authorId}: ${comment.body}`;
        list.appendChild(li);
    });
}

async function submitComment() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const body = document.getElementById('new-comment').value;
    const authorId = localStorage.getItem('userId');
    if (!authorId) return alert('Login required');
    const response = await fetch(`${SCRIPT_URL}?action=addComment&slug=${encodeURIComponent(slug)}&body=${encodeURIComponent(body)}&authorId=${encodeURIComponent(authorId)}`);
    const data = await response.json();
    if (data.success) {
        loadComments(slug);
        document.getElementById('new-comment').value = '';
    } else {
        alert('Comment submission failed');
    }
}

async function submitArticle() {
    const title = document.getElementById('title').value;
    const categories = Array.from(document.getElementById('category').selectedOptions).map(opt => opt.value);
    const contentText = document.getElementById('content').value;
    const authorId = localStorage.getItem('userId');
    if (!authorId) return alert('Login required');
    const response = await fetch(`${SCRIPT_URL}?action=submitArticle&title=${encodeURIComponent(title)}&categories=${encodeURIComponent(categories.join(','))}&contentText=${encodeURIComponent(contentText)}&authorId=${encodeURIComponent(authorId)}`);
    const data = await response.json();
    if (data.success) {
        window.location.href = `article.html?slug=${encodeURIComponent(data.slug)}`;
    } else {
        alert('Submit failed: ' + data.message);
    }
}

async function editArticle() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const title = document.getElementById('title').value;
    const categories = Array.from(document.getElementById('category').selectedOptions).map(opt => opt.value);
    const contentText = document.getElementById('content').value;
    const summary = document.getElementById('summary').value;
    const editorId = localStorage.getItem('userId');
    const response = await fetch(`${SCRIPT_URL}?action=editArticle&slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&categories=${encodeURIComponent(categories.join(','))}&contentText=${encodeURIComponent(contentText)}&summary=${encodeURIComponent(summary)}&editorId=${encodeURIComponent(editorId)}`);
    const data = await response.json();
    if (data.success) {
        window.location.href = `article.html?slug=${encodeURIComponent(slug)}`;
    } else {
        alert('Edit failed: ' + data.message);
    }
}

function loadTemplate() {
    const category = document.getElementById('category').value;
    const template = TEMPLATES[category] || '';
    document.getElementById('content').value = template;
}
