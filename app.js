
// app.js
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
    const response = await fetch(`${SCRIPT_URL}?action=login&username=${username}&email=${email}`);
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('username', username);
        localStorage.setItem('name', data.name);
        localStorage.setItem('userId', data.userId);
        window.location.href = 'index.html';
    } else {
        alert('Login failed');
    }
}

async function signup() {
    const name = document.getElementById('name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const response = await fetch(`${SCRIPT_URL}?action=signup&name=${name}&username=${username}&email=${email}`);
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('username', username);
        localStorage.setItem('name', name);
        localStorage.setItem('userId', data.userId);
        window.location.href = 'index.html';
    } else {
        alert('Signup failed: ' + data.message);
    }
}

async function loadLatestArticles() {
    const response = await fetch(`${SCRIPT_URL}?action=getLatestArticles`);
    const articles = await response.json();
    const list = document.getElementById('latest-list');
    list.innerHTML = '';
    articles.forEach(article => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="article.html?title=${encodeURIComponent(article.title)}">${article.title}</a>`;
        list.appendChild(li);
    });
}

async function loadArticlesByCategory(category) {
    const response = await fetch(`${SCRIPT_URL}?action=getArticlesByCategory&category=${category}`);
    const articles = await response.json();
    // Display in a new section or modal, for simplicity alert
    alert(articles.map(a => a.title).join('\n'));
}

async function searchArticles() {
    const query = document.getElementById('search-bar').value;
    const response = await fetch(`${SCRIPT_URL}?action=searchArticles&query=${query}`);
    const articles = await response.json();
    // Similar to above, display results
    alert(articles.map(a => a.title).join('\n'));
}

async function loadArticle(title) {
    const response = await fetch(`${SCRIPT_URL}?action=getArticle&title=${title}`);
    const article = await response.json();
    document.getElementById('article-title').textContent = article.title;
    // Parse content for infobox and links
    const content = article.content.replace(/\[\[([^\]]+)\]\]/g, '<a href="article.html?title=$1">$1</a>');
    const infoboxMatch = content.match(/{{Infobox(.*?)}}/s);
    if (infoboxMatch) {
        document.getElementById('infobox').innerHTML = parseInfobox(infoboxMatch[1]);
    }
    document.getElementById('article-content').innerHTML = content.replace(/{{Infobox(.*?)}}/s, '');
}

function parseInfobox(content) {
    // Simple parsing, convert |key=value to table
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

async function loadArticleForEdit(title) {
    const response = await fetch(`${SCRIPT_URL}?action=getArticle&title=${title}`);
    const article = await response.json();
    document.getElementById('title').value = article.title;
    document.getElementById('content').value = article.content;
}

async function loadEditHistory(title) {
    const response = await fetch(`${SCRIPT_URL}?action=getEditHistory&title=${title}`);
    const history = await response.json();
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    history.forEach(edit => {
        const li = document.createElement('li');
        li.textContent = `${edit.date} by ${edit.editor}: ${edit.summary}`;
        list.appendChild(li);
    });
}

async function loadComments(title) {
    const response = await fetch(`${SCRIPT_URL}?action=getComments&title=${title}`);
    const comments = await response.json();
    const list = document.getElementById('comments-list');
    list.innerHTML = '';
    comments.forEach(comment => {
        const li = document.createElement('li');
        li.textContent = `${comment.date} by ${comment.commenter}: ${comment.comment}`;
        list.appendChild(li);
    });
}

async function submitComment() {
    const title = document.getElementById('article-title').textContent;
    const comment = document.getElementById('new-comment').value;
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Login required');
    const response = await fetch(`${SCRIPT_URL}?action=addComment&title=${title}&comment=${comment}&authorId=${userId}`, {method: 'POST'});
    const data = await response.json();
    if (data.success) {
        loadComments(title);
    }
}

async function submitArticle() {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const userId = localStorage.getItem('userId');
    const response = await fetch(`${SCRIPT_URL}?action=submitArticle&title=${title}&category=${category}&content=${content}&authorId=${userId}`, {method: 'POST'});
    const data = await response.json();
    if (data.success) {
        window.location.href = `article.html?title=${encodeURIComponent(title)}`;
    } else {
        alert('Submit failed: ' + data.message);
    }
}

async function editArticle() {
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const summary = document.getElementById('summary').value;
    const userId = localStorage.getItem('userId');
    const response = await fetch(`${SCRIPT_URL}?action=editArticle&title=${title}&content=${content}&summary=${summary}&editorId=${userId}`, {method: 'POST'});
    const data = await response.json();
    if (data.success) {
        window.location.href = `article.html?title=${encodeURIComponent(title)}`;
    }
}

function loadTemplate() {
    const category = document.getElementById('category').value;
    const template = TEMPLATES[category] || '';
    document.getElementById('content').value = template;
}
