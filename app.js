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
        profile.setAttribute('tooltip', username);
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
            alert('Login failed: Invalid username or email');
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
        const list = document.getElementById('category-list');
        if (list) {
            list.innerHTML = '';
            articles.forEach(article => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="article.html?id=${encodeURIComponent(article.id)}">${article.title}</a>`;
                list.appendChild(li);
            });
        } else {
            window.location.href = `category.html?category=${encodeURIComponent(category)}`;
        }
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
        const response = await fetch(`${SCRIPT_URL}?action=searchArticles&query=${encodeURIComponent(query)}`);
        const articles = await response.json();
        const list = document.getElementById('results-list');
        if (list) {
            list.innerHTML = '';
            articles.forEach(article => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="article.html?id=${encodeURIComponent(article.id)}">${article.title}</a>`;
                list.appendChild(li);
            });
        } else {
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    } catch (error) {
        alert('Error searching articles: ' + error.message);
    } finally {
        hideLoading();
    }
}

function parseWikiText(content, idMap) {
    let html = content.trim();
    // Remove any {{Cite}} templates to avoid rendering issues
    html = html.replace(/{{Cite\s*\|[^}]*}}/gs, '');
    // Convert ==Section== to collapsible heading
    html = html.replace(/^==\s*([^\n=]+?)\s*==$/gm, (match, title) => `
        <div class="mw-heading mw-heading2 section-heading collapsible-heading open-block" role="button" tabindex="0">
            <span class="mf-icon mf-icon-expand mf-icon--small indicator"></span>
            <h2 id="${title.replace(/\s+/g, '_')}">${title}</h2>
            <span class="mw-editsection">
                <a class="cdx-button cdx-button--size-large cdx-button--fake-button cdx-button--icon-only cdx-button--weight-quiet" href="#" role="button" title="Edit section: ${title}">
                    <span class="minerva-icon minerva-icon--edit"></span>
                    <span class="visually-hidden">edit</span>
                </a>
            </span>
        </div>
        <section class="mf-section-0 collapsible-block collapsible-block-js open-block">
    `);
    // Convert ===Subsection=== to <h3>
    html = html.replace(/^===\s*([^\n=]+?)\s*===$/gm, '</section><h3>$1</h3>');
    // Convert '''bold''' to <strong>
    html = html.replace(/'''([^']+?)'''/g, '<strong>$1</strong>');
    // Convert ''italic'' to <em>
    html = html.replace(/''([^']+?)''/g, '<em>$1</em>');
    // Convert * Item to <ul><li>Item</li></ul>
    let listLevel = 0;
    html = html.split('\n').map(line => {
        const listMatch = line.match(/^\*+\s*(.+)$/);
        if (listMatch) {
            const level = line.match(/^\*+/)[0].length;
            const item = listMatch[1];
            let result = '';
            if (level > listLevel) {
                result += '<ul>'.repeat(level - listLevel);
            } else if (level < listLevel) {
                result += '</ul>'.repeat(listLevel - level);
            }
            result += `<li>${item}</li>`;
            listLevel = level;
            return result;
        } else if (listLevel > 0) {
            const closing = '</ul>'.repeat(listLevel);
            listLevel = 0;
            return closing + (line.trim() ? `<p>${line}</p>` : '');
        }
        return line.trim() ? `<p>${line}</p>` : '';
    }).join('\n');
    if (listLevel > 0) {
        html += '</ul>'.repeat(listLevel);
    }
    // Close open sections
    html += '</section>';
    // Automatically link article titles
    for (const [title, titleId] of Object.entries(idMap)) {
        const regex = new RegExp(`\\b${title.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b(?![^\[]*\]\])`, 'g');
        html = html.replace(regex, `<a href="article.html?id=${encodeURIComponent(titleId)}">${title}</a>`);
    }
    // Convert [[Link]] to <a href="article.html?id=ID">Link</a>
    html = html.replace(/\[\[([^\]]+?)\]\]/g, (match, title) => {
        return `<a href="article.html?id=${encodeURIComponent(idMap[title] || '')}">${title}</a>`;
    });
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
        document.getElementById('short-description').textContent = article.shortDescription || '';
        let content = article.content;
        const infoboxMatch = content.match(/{{Infobox\s*\|(.*?)}}/s);
        if (infoboxMatch) {
            document.getElementById('infobox').innerHTML = parseInfobox(infoboxMatch[1], article.category);
            content = content.replace(/{{Infobox\s*\|(.*?)}}/s, '');
        }
        content = parseWikiText(content, article.idMap);
        document.getElementById('article-content').innerHTML = content;
    } catch (error) {
        alert('Error loading article: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadTalk(id) {
    showLoading();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getArticleById&id=${id}`);
        const article = await response.json();
        if (!article.title) {
            throw new Error('Article not found');
        }
        document.getElementById('article-title').textContent = `Talk: ${article.title}`;
        document.getElementById('page-title').textContent = `Kashurpedia - Talk: ${article.title}`;
        document.getElementById('short-description').textContent = article.shortDescription || '';
        await loadComments(id);
        document.getElementById('comments').style.display = 'block';
    } catch (error) {
        alert('Error loading talk page: ' + error.message);
    } finally {
        hideLoading();
    }
}

function parseInfobox(content, category) {
    const lines = content.split('|').filter(line => line.includes('='));
    let html = '<tbody>';
    html += `<tr><th class="infobox-above" colspan="2"><div class="fn org">${document.getElementById('article-title').textContent}</div></th></tr>`;
    html += `<tr><td class="infobox-subheader" colspan="2"><div class="category">${category}</div></td></tr>`;
    lines.forEach(line => {
        const [key, value] = line.split('=').map(s => s.trim());
        if (key && value) {
            html += `<tr><th class="infobox-label" scope="row">${key}</th><td class="infobox-data">${value}</td></tr>`;
        }
    });
    html += '</tbody>';
    return html;
}

function validateContent(content, category, selectedOptions) {
    const errors = [];
    if (!selectedOptions) return errors;
    if (selectedOptions.infobox && !content.match(/{{Infobox\s*\|/)) {
        errors.push('Missing {{Infobox}} template. Include an Infobox with selected fields.');
    } else if (selectedOptions.infobox) {
        const infoboxMatch = content.match(/{{Infobox\s*\|(.*?)}}/s);
        if (infoboxMatch) {
            const fields = infoboxMatch[1].split('|').filter(line => line.includes('=')).map(line => line.split('=')[0].trim());
            for (const field of selectedOptions.infoboxFields || []) {
                if (!fields.includes(field)) {
                    errors.push(`Missing selected Infobox field: ${field}`);
                }
            }
        }
    }
    for (const section of selectedOptions.sections || []) {
        if (!content.match(new RegExp(`^==\\s*${section}\\s*==$`, 'm'))) {
            errors.push(`Missing selected section: ==${section}==`);
        }
    }
    return errors;
}

function loadTemplateOptions() {
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const optionsContainer = document.getElementById('template-options');
    optionsContainer.innerHTML = '';
    const template = TEMPLATES[category] || {};
    const infoboxFields = template.infoboxFields || [];
    const sections = template.sections || [];

    // Detect existing content
    const hasInfobox = content.match(/{{Infobox\s*\|/);
    const existingInfoboxFields = hasInfobox ? content.match(/{{Infobox\s*\|(.*?)}}/s)[1]
        .split('|')
        .filter(line => line.includes('='))
        .map(line => line.split('=')[0].trim()) : [];
    const existingSections = content.match(/^==\s*([^\n=]+?)\s*==$/gm)?.map(match => match.replace(/^==\s*|\s*==$/g, '')) || [];

    const optionsHtml = `
        <div class="template-option">
            <label><input type="checkbox" id="include-infobox" ${hasInfobox ? 'checked' : ''}> Include Infobox</label>
            <div id="infobox-fields" style="margin-left: 1.5rem; margin-top: 0.5rem;"></div>
        </div>
        <div class="template-option">
            <label><input type="checkbox" id="include-sections" ${existingSections.length > 0 ? 'checked' : ''}> Include Sections</label>
            <div id="section-options" style="margin-left: 1.5rem; margin-top: 0.5rem;"></div>
        </div>
    `;
    optionsContainer.innerHTML = optionsHtml;

    const infoboxFieldsContainer = document.getElementById('infobox-fields');
    infoboxFields.forEach(field => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="infobox-field" value="${field}" ${existingInfoboxFields.includes(field) ? 'checked' : ''}> ${field}`;
        infoboxFieldsContainer.appendChild(label);
    });

    const sectionsContainer = document.getElementById('section-options');
    sections.forEach(section => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="section" value="${section}" ${existingSections.includes(section) ? 'checked' : ''}> ${section}`;
        sectionsContainer.appendChild(label);
    });
}

function generateTemplate() {
    const category = document.getElementById('category').value;
    const includeInfobox = document.getElementById('include-infobox').checked;
    const infoboxFields = Array.from(document.querySelectorAll('input[name="infobox-field"]:checked')).map(input => input.value);
    const includeSections = document.getElementById('include-sections').checked;
    const sections = Array.from(document.querySelectorAll('input[name="section"]:checked')).map(input => input.value);

    const content = document.getElementById('content');
    let currentContent = content.value.trim();
    let template = '';

    // Append infobox if selected and not already present
    if (includeInfobox && infoboxFields.length > 0 && !currentContent.match(/{{Infobox\s*\|/)) {
        template += '{{Infobox\n';
        infoboxFields.forEach(field => {
            template += `|${field} = \n`;
        });
        template += '}}\n\n';
    }

    // Append new sections if selected and not already present
    if (includeSections && sections.length > 0) {
        const existingSections = currentContent.match(/^==\s*([^\n=]+?)\s*==$/gm)?.map(match => match.replace(/^==\s*|\s*==$/g, '')) || [];
        const newSections = sections.filter(section => !existingSections.includes(section));
        newSections.forEach(section => {
            template += `==${section}==\n\n`;
        });
    }

    // Append template to existing content if there's content, otherwise set it
    if (currentContent && template) {
        content.value = currentContent + (currentContent.endsWith('\n') ? '' : '\n') + template;
    } else if (template) {
        content.value = template;
    }
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
        document.getElementById('short-description').value = article.shortDescription || '';
        document.getElementById('content').value = article.content;
        document.getElementById('category').value = article.category;
        loadTemplateOptions();
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
            li.setAttribute('tooltip', `Edit on ${edit.date}`);
            list.appendChild(li);
        });
    } catch (error) {
        alert('Error loading edit history: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadComments(id) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getComments&id=${id}`);
        const comments = await response.json();
        const list = document.getElementById('comments-list');
        list.innerHTML = '';
        comments.forEach(comment => {
            const li = document.createElement('li');
            li.textContent = `${comment.date} by ${comment.commenter}: ${comment.comment}`;
            li.setAttribute('tooltip', `Posted on ${comment.date}`);
            list.appendChild(li);
        });
    } catch (error) {
        alert('Error loading comments: ' + error.message);
    }
}

async function submitComment() {
    showLoading();
    const id = new URLSearchParams(window.location.search).get('id');
    const comment = document.getElementById('new-comment').value;
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Login required to comment');
        hideLoading();
        return;
    }
    if (!comment.trim()) {
        alert('Comment cannot be empty');
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=addComment&id=${id}&comment=${encodeURIComponent(comment)}&authorId=${userId}`, {method: 'POST'});
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
    const shortDescription = document.getElementById('short-description').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const userId = localStorage.getItem('userId');
    const selectedOptions = {
        infobox: document.getElementById('include-infobox').checked,
        infoboxFields: Array.from(document.querySelectorAll('input[name="infobox-field"]:checked')).map(input => input.value),
        sections: Array.from(document.querySelectorAll('input[name="section"]:checked')).map(input => input.value)
    };
    if (shortDescription.length > 500) {
        alert('Short description must be under 500 characters');
        hideLoading();
        return;
    }
    const errors = validateContent(content, category, selectedOptions);
    if (errors.length > 0) {
        alert('Submission errors:\n- ' + errors.join('\n- '));
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=submitArticle&title=${encodeURIComponent(title)}&shortDescription=${encodeURIComponent(shortDescription)}&category=${category}&content=${encodeURIComponent(content)}&authorId=${userId}`, {method: 'POST'});
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
    const shortDescription = document.getElementById('short-description').value;
    const content = document.getElementById('content').value;
    const summary = document.getElementById('summary').value;
    const category = document.getElementById('category').value;
    const userId = localStorage.getItem('userId');
    const selectedOptions = {
        infobox: document.getElementById('include-infobox').checked,
        infoboxFields: Array.from(document.querySelectorAll('input[name="infobox-field"]:checked')).map(input => input.value),
        sections: Array.from(document.querySelectorAll('input[name="section"]:checked')).map(input => input.value)
    };
    if (shortDescription.length > 500) {
        alert('Short description must be under 500 characters');
        hideLoading();
        return;
    }
    const errors = validateContent(content, category, selectedOptions);
    if (errors.length > 0) {
        alert('Submission errors:\n- ' + errors.join('\n- '));
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=editArticle&id=${id}&shortDescription=${encodeURIComponent(shortDescription)}&content=${encodeURIComponent(content)}&summary=${encodeURIComponent(summary)}&editorId=${userId}&category=${category}`, {method: 'POST'});
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
