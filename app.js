// Generic helpers
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const getParam = (k) => new URL(location.href).searchParams.get(k);
const slugify = (s) => s.toLowerCase().trim()
  .replace(/[\s\_]+/g,'-').replace(/[^a-z0-9\-]/g,'').replace(/\-+/g,'-');

// Session (very simple)
const session = {
  get() { try { return JSON.parse(localStorage.getItem('kp_user')); } catch { return null; } },
  set(u) { localStorage.setItem('kp_user', JSON.stringify(u)); },
  clear() { localStorage.removeItem('kp_user'); }
};

// API layer
async function apiGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { method: 'GET' });
  return res.json();
}
async function apiPost(body) {
  const res = await fetch(GAS_URL, { method:'POST', body: JSON.stringify(body) });
  return res.json();
}

// UI: top-right user box
function renderUserBox() {
  const box = $("#userBox");
  if (!box) return;
  const u = session.get();
  if (!u) {
    box.innerHTML = `<a class="btn" href="login.html">Log in</a>`;
  } else {
    const letter = (u.name||u.username||'?').trim()[0]?.toUpperCase() || '?';
    box.innerHTML = `
      <a class="btn secondary" href="submit.html">New</a>
      <div class="avatar" title="${u.name}">${letter}</div>
      <button class="btn secondary" onclick="session.clear(); location.reload()">Logout</button>
    `;
  }
}

// Search handlers
async function attachSearch() {
  const input = $("#searchInput");
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) location.href = `index.html?q=${encodeURIComponent(q)}`;
    }
  });
}

// Home page
async function initHome() {
  renderUserBox(); attachSearch();

  // categories
  const chips = $("#catChips");
  if (chips) {
    const cats = DEFAULT_CATEGORIES;
    chips.innerHTML = cats.map(c => `<a class="chip" href="index.html?cat=${encodeURIComponent(c)}">${c}</a>`).join("");
  }

  const q = getParam('q');
  const cat = getParam('cat');
  const res = await apiGet({ action: 'list', q: q||'', cat: cat||'' });
  const grid = $("#articleGrid");
  if (grid) {
    grid.innerHTML = (res.items||[]).map(a => `
      <a class="card" href="article.html?slug=${encodeURIComponent(a.slug)}">
        <div class="badge">${a.type}</div>
        <h3>${a.title}</h3>
        <div class="meta">Updated ${new Date(a.updatedAt).toLocaleString()}</div>
        <div class="chips">${(a.categories||[]).map(c=>`<span class="chip">${c}</span>`).join('')}</div>
      </a>
    `).join("");
  }
}

// Article page
function wikiLinksToAnchors(text) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (m, p1) => {
    const slug = slugify(p1);
    return `<a href="article.html?slug=${encodeURIComponent(slug)}">${p1}</a>`;
  });
}
function renderInfobox(article) {
  const fields = article.content?.fields || {};
  const pairs = Object.entries(fields);
  if (!pairs.length) return "";
  return `
    <aside class="infobox">
      <h3>${article.type} facts</h3>
      <table class="table">
        ${pairs.map(([k,v]) => `<tr><th style="width:40%">${k}</th><td>${v||''}</td></tr>`).join('')}
      </table>
    </aside>
  `;
}

async function initArticle() {
  renderUserBox(); attachSearch();
  const slug = getParam('slug');
  if (!slug) return;
  const data = await apiGet({ action:'get', slug });
  if (!data.item) { $("#articleContainer").innerHTML = "<p>Article not found.</p>"; return; }

  const a = data.item;

  $("#articleContainer").innerHTML = `
    ${renderInfobox(a)}
    <h1>${a.title}</h1>
    <div class="meta">Type: <span class="badge">${a.type}</span> • Updated ${new Date(a.updatedAt).toLocaleString()}</div>
    <div class="chips" style="margin:8px 0;">${(a.categories||[]).map(c=>`<a class="chip" href="index.html?cat=${encodeURIComponent(c)}">${c}</a>`).join('')}</div>
    <div class="content">${wikiLinksToAnchors((a.content?.body||'').replace(/\n/g,'<br/>'))}</div>
    <div style="margin-top:12px;">
      <a class="btn" href="edit.html?id=${encodeURIComponent(a.id)}">Edit</a>
    </div>
  `;

  // revisions
  const revs = await apiGet({ action:'revisions', articleId: a.id });
  const tbody = $("#revTable tbody");
  tbody.innerHTML = (revs.items||[]).map(r => `
    <tr>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
      <td>${r.editorName||r.editorId}</td>
      <td>${r.summary||''}</td>
    </tr>
  `).join("");

  // comments
  const user = session.get();
  const clist = $("#commentList");
  const comments = await apiGet({ action:'comments', articleId: a.id });
  clist.innerHTML = (comments.items||[]).map(c => `
    <div class="card"><div class="meta">${c.authorName||c.authorId} • ${new Date(c.createdAt).toLocaleString()}</div>
    <div>${c.body.replace(/\n/g,'<br/>')}</div></div>
  `).join("");

  const cbox = $("#commentBox");
  if (user) {
    cbox.innerHTML = `
      <textarea id="commentText" class="input" placeholder="Add a comment"></textarea>
      <button class="btn" id="commentBtn">Post comment</button>
    `;
    $("#commentBtn").onclick = async () => {
      const body = $("#commentText").value.trim();
      if (!body) return;
      const r = await apiPost({ action:'addComment', articleId:a.id, body, authorId:user.id });
      if (r.ok) location.reload();
      else alert(r.error||'Failed to add comment');
    };
  } else {
    cbox.innerHTML = `<a class="btn" href="login.html">Log in to comment</a>`;
  }
}

// Submit page
function renderTemplateFields(container, type, data={}) {
  const fields = ARTICLE_TEMPLATES[type] || [];
  container.innerHTML = fields.map(f => `
    <label>${f.label}<input class="input" name="field_${f.key}" value="${(data[f.key]||'').toString().replace(/"/g,'&quot;')}" /></label>
  `).join("");
}

async function initSubmit() {
  renderUserBox();
  const u = session.get();
  if (!u) { location.href = "login.html"; return; }

  // populate types
  const sel = $("#typeSelect");
  sel.innerHTML = Object.keys(ARTICLE_TEMPLATES).map(t => `<option>${t}</option>`).join("");
  const fieldsDiv = $("#templateFields");
  renderTemplateFields(fieldsDiv, sel.value);
  sel.onchange = () => renderTemplateFields(fieldsDiv, sel.value);

  $("#createForm").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title').toString().trim();
    const type = fd.get('type').toString();
    const body = fd.get('body').toString();
    const cats = fd.get('categories').toString().split(',').map(s=>s.trim()).filter(Boolean);

    const fields = {};
    (ARTICLE_TEMPLATES[type]||[]).forEach(f => {
      fields[f.key] = fd.get(`field_${f.key}`) ? fd.get(`field_${f.key}`).toString() : "";
    });

    const res = await apiPost({
      action: 'createArticle',
      title, type, body, fields, categories: cats, authorId: u.id
    });
    if (res.ok) location.href = `article.html?slug=${encodeURIComponent(res.slug)}`;
    else alert(res.error||'Failed');
  };
}

// Edit page
async function initEdit() {
  renderUserBox();
  const u = session.get();
  if (!u) { location.href = "login.html"; return; }

  const id = getParam('id');
  const data = await apiGet({ action:'getById', id });
  if (!data.item) { document.body.innerHTML = "<p>Article not found</p>"; return; }
  const a = data.item;

  const sel = $("#typeSelect");
  sel.innerHTML = Object.keys(ARTICLE_TEMPLATES).map(t => `<option ${t===a.type?'selected':''}>${t}</option>`).join("");
  const fieldsDiv = $("#templateFields");
  renderTemplateFields(fieldsDiv, sel.value, a.content?.fields || {});
  sel.onchange = () => renderTemplateFields(fieldsDiv, sel.value, a.content?.fields || {});

  const form = $("#editForm");
  form.elements["id"].value = a.id;
  form.elements["title"].value = a.title;
  form.elements["type"].value = a.type;
  form.elements["body"].value = a.content?.body || "";
  form.elements["categories"].value = (a.categories||[]).join(', ');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title').toString().trim();
    const type = fd.get('type').toString();
    const body = fd.get('body').toString();
    const summary = fd.get('summary').toString();
    const cats = fd.get('categories').toString().split(',').map(s=>s.trim()).filter(Boolean);

    const fields = {};
    (ARTICLE_TEMPLATES[type]||[]).forEach(f => {
      fields[f.key] = fd.get(`field_${f.key}`) ? fd.get(`field_${f.key}`).toString() : "";
    });

    const res = await apiPost({
      action: 'editArticle',
      id: a.id, title, type, body, fields, categories: cats,
      editorId: u.id, summary
    });
    if (res.ok) location.href = `article.html?slug=${encodeURIComponent(res.slug)}`;
    else alert(res.error||'Failed');
  };
}

// Login page
async function initLogin() {
  const form = $("#loginForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      action: 'signUp',
      name: fd.get('name').toString().trim(),
      username: fd.get('username').toString().trim(),
      email: fd.get('email').toString().trim()
    };
    const res = await apiPost(payload);
    if (res.ok) {
      session.set(res.user);
      location.href = "index.html";
    } else {
      alert(res.error || "Failed to sign in");
    }
  };
}

// Router
document.addEventListener('DOMContentLoaded', () => {
  renderUserBox(); attachSearch();
  if (location.pathname.endsWith('index.html') || location.pathname === '/' ) initHome();
  if (location.pathname.endsWith('article.html')) initArticle();
  if (location.pathname.endsWith('submit.html')) initSubmit();
  if (location.pathname.endsWith('edit.html')) initEdit();
  if (location.pathname.endsWith('login.html')) initLogin();
});
