

// app.js
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

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
    } catch (error) {
        alert('Error during login: ' + error.message);
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
    } catch (error) {
        alert('Error during signup: ' + error.message);
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
            li.innerHTML = `<a href="article.html?id=${encodeURIComponent(article.id)}">${article.title}</a>`;
            list.appendChild(li);
        });
    } catch (error) {
        alert('Error loading articles: ' + error.message);
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
    } catch (error) {
        alert('Error loading category articles: ' + error.message);
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
    } catch (error) {
        alert('Error searching articles: ' + error.message);
    } finally {
        hideLoading();
    }
}

function parseWikiText(content, idMap) {
    let html = content;
    // Convert ==Section== to <h2>Section</h2>
    html = html.replace(/^==\s*([^=\n]+)\s*==$/gm, '<h2>$1</h2>');
    // Convert ===Subsection=== to <h3>Subsection</h3>
    html = html.replace(/^===\s*([^=\n]+)\s*===$/gm, '<h3>$1</h3>');
    // Convert '''bold''' to <strong>bold</strong>
    html = html.replace(/'''([^']+)'''/g, '<strong>$1</strong>');
    // Convert ''italic'' to <em>italic</em>
    html = html.replace(/''([^']+)''/g, '<em>$1</em>');
    // Convert * Item to <ul><li>Item</li></ul>
    let listOpen = false;
    html = html.split('\n').map(line => {
        if (line.match(/^\*\s*(.+)$/)) {
            if (!listOpen) {
                listOpen = true;
                return `<ul><li>${line.replace(/^\*\s*(.+)$/, '$1')}</li>`;
            }
            return `<li>${line.replace(/^\*\s*(.+)$/, '$1')}</li>`;
        } else if (listOpen) {
            listOpen = false;
            return `</ul>${line}`;
        }
        return line;
    }).join('\n');
    if (listOpen) {
        html += '</ul>';
    }
    // Automatically link article titles
    for (const [title, titleId] of Object.entries(idMap)) {
        const regex = new RegExp(`\\b${title.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b(?![^\[]*\]\])`, 'g');
        html = html.replace(regex, `<a href="article.html?id=${encodeURIComponent(titleId)}">${title}</a>`);
    }
    // Convert [[Link]] to <a href="article.html?id=ID">Link</a>
    html = html.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
        return `<a href="article.html?id=${encodeURIComponent(idMap[title] || '')}">${title}</a>`;
    });
    // Wrap non-heading/list lines in <p> tags
    html = html.split('\n').map(line => {
        if (!line.match(/^(<h[23]|<ul>|<li>|<\/ul>)/) && line.trim()) {
            return `<p>${line}</p>`;
        }
        return line;
    }).join('');
    return html;
}

async function loadArticle(id) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getArticleById&id=${id}`);
        const article = await response.json();
        if (!article.title) {
            throw new Error('Article not found');
        }
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('page-title').textContent = `Kashurpedia - ${article.title}`;
        let content = article.content;
        const infoboxMatch = content.match(/{{Infobox(.*?)}}/s);
        if (infoboxMatch) {
            document.getElementById('infobox').innerHTML = parseInfobox(infoboxMatch[1]);
            content = content.replace(/{{Infobox(.*?)}}/s, '');
        }
        const citationMatches = content.match(/{{Cite(.*?)}}/gs) || [];
        const citations = citationMatches.map(match => {
            const params = match.match(/\|([^=]+)=([^|]+)/g) || [];
            const citation = {};
            params.forEach(param => {
                const [key, value] = param.split('=').map(s => s.trim());
                citation[key] = value;
            });
            return citation;
        });
        content = parseWikiText(content, article.idMap);
        content = content.replace(/{{Cite(.*?)}}/g, (match, index) => `<sup>[${citationMatches.indexOf(match) + 1}]</sup>`);
        document.getElementById('article-content').innerHTML = content;
        const citationList = document.getElementById('citations-list');
        citationList.innerHTML = '';
        citations.forEach((citation, index) => {
            const li = document.createElement('li');
            li.innerHTML = citation.url ? `<a href="${citation.url}" target="_blank">${citation.title || 'Source'}</a> (${citation.author || 'Unknown'}, ${citation.date || 'No date'})` : `${citation.title || 'Source'} (${citation.author || 'Unknown'}, ${citation.date || 'No date'})`;
            citationList.appendChild(li);
        });
    } catch (error) {
        alert('Error loading article: ' + error.message);
    } finally {
        hideLoading();
    }
}

function parseInfobox(content) {
    const lines = content.split('|').filter(line => line.includes('='));
    let html = '<table>';
    lines.forEach(line => {
        const [key, value] = line.split('=').map(s => s.trim());
        html += `<tr><th>${key}:</th><td>${value}</td></tr>`;
    });
    html += '</table>';
    return html;
}

function validateContent(content, category) {
    const errors = [];
    // Check for Infobox
    if (!content.match(/{{Infobox\s*\|/)) {
        errors.push('Missing {{Infobox}} template. Include an Infobox with required fields.');
    } else {
        const infoboxMatch = content.match(/{{Infobox(.*?)}}/s);
        if (infoboxMatch) {
            const fields = infoboxMatch[1].split('|').filter(line => line.includes('=')).map(line => line.split('=')[0].trim());
            const requiredFields = {
                'Villages': ['name', 'district', 'population'],
                'Districts': ['name', 'capital', 'area'],
                'Famous People': ['name', 'birth_date', 'occupation'],
                'Colleges': ['name', 'established', 'location'],
                'Schools': ['name', 'established', 'location'],
                'Mosques': ['name', 'built', 'location']
            }[category];
            for (const field of requiredFields) {
                if (!fields.includes(field)) {
                    errors.push(`Missing required Infobox field: ${field}`);
                }
            }
        }
    }
    // Check for References section
    if (!content.match(/^==\s*References\s*==$/m)) {
        errors.push('Missing ==References== section. Add a References section with at least one {{Cite}} template.');
    }
    // Check for valid Cite templates
    const citationMatches = content.match(/{{Cite(.*?)}}/gs) || [];
    citationMatches.forEach((match, index) => {
        const params = match.match(/\|([^=]+)=([^|]+)/g) || [];
        const citation = {};
        params.forEach(param => {
            const [key, value] = param.split('=').map(s => s.trim());
            citation[key] = value;
        });
        if (!citation.title) {
            errors.push(`Citation ${index + 1} missing title. Use |title= in {{Cite}} template.`);
        }
    });
    // Check for required sections
    const requiredSections = {
        'Villages': ['History', 'Geography', 'References'],
        'Districts': ['Overview', 'Economy', 'References'],
        'Famous People': ['Biography', 'Achievements', 'References'],
        'Colleges': ['Courses', 'Facilities', 'References'],
        'Schools': ['Curriculum', 'Extracurricular', 'References'],
        'Mosques': ['Architecture', 'History', 'References']
    }[category];
    for (const section of requiredSections) {
        if (!content.match(new RegExp(`^==\\s*${section}\\s*==$`, 'm'))) {
            errors.push(`Missing required section: ==${section}==`);
        }
    }
    return errors;
}

async function loadArticleForEdit(id) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getArticleById&id=${id}`);
        const article = await response.json();
        if (!article.title) {
            throw new Error('Article not found');
        }
        document.getElementById('title').value = article.title;
        document.getElementById('content').value = article.content;
        document.getElementById('category').value = article.category;
    } catch (error) {
        alert('Error loading article for edit: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadEditHistory(id) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getEditHistory&id=${id}`);
        const history = await response.json();
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        history.forEach(edit => {
            const li = document.createElement('li');
            li.textContent = `${edit.date} by ${edit.editor}: ${edit.summary}`;
            list.appendChild(li);
        });
    } catch (error) {
        alert('Error loading edit history: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadComments(id) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getComments&id=${id}`);
        const comments = await response.json();
        const list = document.getElementById('comments-list');
        list.innerHTML = '';
        comments.forEach(comment => {
            const li = document.createElement('li');
            li.textContent = `${comment.date} by ${comment.commenter}: ${comment.comment}`;
            list.appendChild(li);
        });
    } catch (error) {
        alert('Error loading comments: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function submitComment() {
    showLoading();
    const id = new URLSearchParams(window.location.search).get('id');
    const comment = document.getElementById('new-comment').value;
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Login required');
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=addComment&id=${id}&comment=${comment}&authorId=${userId}`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            loadComments(id);
            document.getElementById('new-comment').value = '';
        } else {
            alert('Failed to add comment');
        }
    } catch (error) {
        alert('Error adding comment: ' + error.message);
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
    const errors = validateContent(content, category);
    if (errors.length > 0) {
        alert('Submission errors:\n- ' + errors.join('\n- '));
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=submitArticle&title=${title}&category=${category}&content=${content}&authorId=${userId}`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            window.location.href = `article.html?id=${encodeURIComponent(data.articleId)}`;
        } else {
            alert('Submit failed: ' + data.message);
        }
    } catch (error) {
        alert('Error submitting article: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function editArticle() {
    showLoading();
    const id = new URLSearchParams(window.location.search).get('id');
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const summary = document.getElementById('summary').value;
    const category = document.getElementById('category').value;
    const userId = localStorage.getItem('userId');
    const errors = validateContent(content, category);
    if (errors.length > 0) {
        alert('Submission errors:\n- ' + errors.join('\n- '));
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=editArticle&id=${id}&content=${content}&summary=${summary}&editorId=${userId}&category=${category}`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            window.location.href = `article.html?id=${encodeURIComponent(id)}`;
        } else {
            alert('Edit failed');
        }
    } catch (error) {
        alert('Error editing article: ' + error.message);
    } finally {
        hideLoading();
    }
}

function loadTemplate() {
    const category = document.getElementById('category').value;
    const template = TEMPLATES[category] || '';
    const content = document.getElementById('content');
    if (!content.value || confirm('Load template? This will overwrite current content.')) {
        content.value = template;
    }
}
