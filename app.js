function checkLogin() {
    const username = localStorage.getItem('username');
    const name = localStorage.getItem('name');
    if (username) {
        const profile = document.getElementById('user-profile');
        profile.innerHTML = name.charAt(0).toUpperCase();
        profile.title = username;
    }
}

function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'block';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

async function login() {
    showLoading();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    try {
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
    } finally {
        hideLoading();
    }
}

async function signup() {
    showLoading();
    const name = document.getElementById('name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    try {
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
    } finally {
        hideLoading();
    }
}

async function loadLatestArticles() {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getLatestArticles`);
        const articles = await response.json();
        const list = document.getElementById('latest-list');
        list.innerHTML = '';
        articles.forEach(article => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="article.html?title=${encodeURIComponent(article.title)}">${article.title}</a>`;
            list.appendChild(li);
        });
    } finally {
        hideLoading();
    }
}

async function loadArticlesByCategory(category) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getArticlesByCategory&category=${category}`);
        const articles = await response.json();
        alert(articles.map(a => a.title).join('\n'));
    } finally {
        hideLoading();
    }
}

async function searchArticles() {
    showLoading();
    const query = document.getElementById('search-bar').value;
    try {
        const response = await fetch(`${SCRIPT_URL}?action=searchArticles&query=${query}`);
        const articles = await response.json();
        alert(articles.map(a => a.title).join('\n'));
    } finally {
        hideLoading();
    }
}

async function loadArticle(title) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getArticle&title=${title}`);
        const article = await response.json();
        document.getElementById('article-title').textContent = article.title;
        const content = article.content.replace(/\[\[([^\]]+)\]\]/g, '<a href="article.html?title=$1">$1</a>');
        const infoboxMatch = content.match(/{{Infobox(.*?)}}/s);
        if (infoboxMatch) {
            document.getElementById('infobox').innerHTML = parseInfobox(infoboxMatch[1]);
        }
        document.getElementById('article-content').innerHTML = content.replace(/{{Infobox(.*?)}}/s, '');
    } finally {
        hideLoading();
    }
}

function parseInfobox(content) {
    const lines = content.split('|').filter(line => line.trim() && line.includes('='));
    let html = '<table>';
    lines.forEach(line => {
        const [key, value] = line.split('=').map(s => s.trim());
        if (key && value) {
            html += `<tr><th style="font-weight: bold; text-align: right; padding-right: 10px;">${key}:</th><td>${value}</td></tr>`;
        }
    });
    html += '</table>';
    return html;
}

async function loadArticleForEdit(title) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getArticle&title=${title}`);
        const article = await response.json();
        document.getElementById('title').value = article.title;
        document.getElementById('content').value = article.content;
        const categoryResponse = await fetch(`${SCRIPT_URL}?action=getArticle&title=${title}`);
        const articleData = await categoryResponse.json();
        if (articleData.category) {
            document.getElementById('category').value = articleData.category;
        } else {
            document.getElementById('content').value = TEMPLATES[articleData.category] || article.content;
        }
    } finally {
        hideLoading();
    }
}

async function loadEditHistory(title) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getEditHistory&title=${title}`);
        const history = await response.json();
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        history.forEach(edit => {
            const li = document.createElement('li');
            li.textContent = `${edit.date} by ${edit.editor}: ${edit.summary}`;
            list.appendChild(li);
        });
    } finally {
        hideLoading();
    }
}

async function loadComments(title) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getComments&title=${title}`);
        const comments = await response.json();
        const list = document.getElementById('comments-list');
        list.innerHTML = '';
        comments.forEach(comment => {
            const li = document.createElement('li');
            li.textContent = `${comment.date} by ${comment.commenter}: ${comment.comment}`;
            list.appendChild(li);
        });
    } finally {
        hideLoading();
    }
}

async function submitComment() {
    showLoading();
    const title = document.getElementById('article-title').textContent;
    const comment = document.getElementById('new-comment').value;
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Login required');
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=addComment&title=${title}&comment=${comment}&authorId=${userId}`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            loadComments(title);
            document.getElementById('new-comment').value = '';
        } else {
            alert('Comment submission failed');
        }
    } finally {
        hideLoading();
    }
}

async function submitArticle() {
    showLoading();
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const userId = localStorage.getItem('userId');
    try {
        const response = await fetch(`${SCRIPT_URL}?action=submitArticle&title=${title}&category=${category}&content=${content}&authorId=${userId}`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            window.location.href = `article.html?title=${encodeURIComponent(title)}`;
        } else {
            alert('Submit failed: ' + data.message);
        }
    } finally {
        hideLoading();
    }
}

async function editArticle() {
    showLoading();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const summary = document.getElementById('summary').value;
    const userId = localStorage.getItem('userId');
    try {
        const response = await fetch(`${SCRIPT_URL}?action=editArticle&title=${title}&content=${content}&summary=${summary}&editorId=${userId}`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            window.location.href = `article.html?title=${encodeURIComponent(title)}`;
        } else {
            alert('Edit failed');
        }
    } finally {
        hideLoading();
    }
}

function loadTemplate() {
    const category = document.getElementById('category').value;
    const template = TEMPLATES[category] || '';
    const currentContent = document.getElementById('content').value;
    if (!currentContent || currentContent === TEMPLATES[currentContent.category]) {
        document.getElementById('content').value = template;
    }
}
