/**
 * Google Apps Script backend for Kashurpedia.
 * Sheets required:
 * USERS(id,email,username,name,createdAt)
 * ARTICLES(id,slug,title,type,authorId,createdAt,updatedAt,contentJson,contentText,categories)
 * REVISIONS(id,articleId,editorId,summary,diff,createdAt)
 * COMMENTS(id,articleId,authorId,body,createdAt)
 * CATEGORIES(name)
 */

const SHEET = {
  USERS: "USERS",
  ARTICLES: "ARTICLES",
  REVISIONS: "REVISIONS",
  COMMENTS: "COMMENTS",
  CATEGORIES: "CATEGORIES"
};

function _ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function _sh(name){ return _ss().getSheetByName(name) || _ss().insertSheet(name); }

function _headers(sheet){
  const r = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  return r;
}
function _rows(sheet){
  const last = Math.max(sheet.getLastRow()-1, 0);
  if (last === 0) return [];
  return sheet.getRange(2,1,last,sheet.getLastColumn()).getValues();
}
function _indexByHeader(sheet){
  const h = _headers(sheet);
  const idx = {};
  h.forEach((k,i)=> idx[k]=i);
  return idx;
}
function _now(){ return new Date().toISOString(); }
function _uuid(){ return Utilities.getUuid(); }

function _ensureHeaders(){
  const specs = {};
  specs[SHEET.USERS] = ["id","email","username","name","createdAt"];
  specs[SHEET.ARTICLES] = ["id","slug","title","type","authorId","createdAt","updatedAt","contentJson","contentText","categories"];
  specs[SHEET.REVISIONS] = ["id","articleId","editorId","summary","diff","createdAt"];
  specs[SHEET.COMMENTS] = ["id","articleId","authorId","body","createdAt"];
  specs[SHEET.CATEGORIES] = ["name"];
  Object.entries(specs).forEach(([name, cols]) => {
    const sh = _sh(name);
    const h = _headers(sh);
    if (h.filter(Boolean).length === 0) {
      sh.getRange(1,1,1,cols.length).setValues([cols]);
    }
  });
}
_ensureHeaders();

function doGet(e){
  const p = e.parameter || {};
  const action = p.action || "ping";
  try {
    if (action === "ping") return _json({ok:true, t:_now()});
    if (action === "list") return _list(p);
    if (action === "get") return _getBySlug(p.slug);
    if (action === "getById") return _getById(p.id);
    if (action === "revisions") return _revisions(p.articleId);
    if (action === "comments") return _comments(p.articleId);
    if (action === "categories") return _categories();
    if (action === "search") return _list({ q: p.q||"" });
    return _json({ ok:false, error:"unknown action"});
  } catch(err){
    return _json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
}

function doPost(e){
  const body = JSON.parse(e.postData.contents || "{}");
  try {
    if (body.action === "signUp") return _signUp(body);
    if (body.action === "createArticle") return _createArticle(body);
    if (body.action === "editArticle") return _editArticle(body);
    if (body.action === "addComment") return _addComment(body);
    return _json({ ok:false, error:"unknown action"});
  } catch(err){
    return _json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
}

function _json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// ---------- USERS ----------
function _signUp(b){
  const sh = _sh(SHEET.USERS);
  const idx = _indexByHeader(sh);
  const rows = _rows(sh);
  // idempotent by email or username
  const existing = rows.find(r => r[idx.email] === b.email || r[idx.username] === b.username);
  if (existing){
    return _json({ ok:true, user: { id: existing[idx.id], email: existing[idx.email], username: existing[idx.username], name: existing[idx.name] } });
  }
  const id = _uuid();
  const row = [id, b.email, b.username, b.name, _now()];
  sh.appendRow(row);
  return _json({ ok:true, user: { id, email:b.email, username:b.username, name:b.name } });
}

// ---------- ARTICLES ----------
function _createArticle(b){
  if (!b.title || !b.type || !b.authorId) throw new Error("Missing fields");
  const sh = _sh(SHEET.ARTICLES);
  const idx = _indexByHeader(sh);
  const id = _uuid();
  const slug = slugify(b.title);
  const createdAt = _now();
  const updatedAt = createdAt;
  const content = { fields: b.fields || {}, body: b.body || "" };
  const contentJson = JSON.stringify(content);
  const contentText = (b.title+" "+(b.body||"")).toLowerCase();
  const categories = (b.categories||[]).join(",");

  sh.appendRow([id, slug, b.title, b.type, b.authorId, createdAt, updatedAt, contentJson, contentText, categories]);

  // revision 0
  const rev = _sh(SHEET.REVISIONS);
  rev.appendRow([_uuid(), id, b.authorId, "Initial creation", "", createdAt]);

  return _json({ ok:true, id, slug });
}

function _getBySlug(slug){
  const sh = _sh(SHEET.ARTICLES);
  const idx = _indexByHeader(sh);
  const rows = _rows(sh);
  const r = rows.find(r => r[idx.slug] === slug);
  if (!r) return _json({ ok:false, error:"not found" });
  return _json({ ok:true, item: _articleRowToObj(r, idx) });
}
function _getById(id){
  const sh = _sh(SHEET.ARTICLES);
  const idx = _indexByHeader(sh);
  const rows = _rows(sh);
  const r = rows.find(r => r[idx.id] === id);
  if (!r) return _json({ ok:false, error:"not found" });
  return _json({ ok:true, item: _articleRowToObj(r, idx) });
}

function _articleRowToObj(r, idx){
  return {
    id: r[idx.id],
    slug: r[idx.slug],
    title: r[idx.title],
    type: r[idx.type],
    authorId: r[idx.authorId],
    createdAt: r[idx.createdAt],
    updatedAt: r[idx.updatedAt],
    content: JSON.parse(r[idx.contentJson]||"{}"),
    categories: (r[idx.categories]||"").split(",").filter(String)
  };
}

function _list(p){
  const sh = _sh(SHEET.ARTICLES);
  const idx = _indexByHeader(sh);
  const rows = _rows(sh);
  let items = rows.map(r => ({
    id: r[idx.id], slug: r[idx.slug], title: r[idx.title], type: r[idx.type],
    updatedAt: r[idx.updatedAt], categories: (r[idx.categories]||"").split(",").filter(String)
  }));
  const q = (p.q||"").toLowerCase();
  const cat = (p.cat||"").toLowerCase();
  if (q) items = items.filter(a => a.title.toLowerCase().includes(q));
  if (cat) items = items.filter(a => (a.categories||[]).some(c => c.toLowerCase()===cat));
  items.sort((a,b) => (new Date(b.updatedAt)) - (new Date(a.updatedAt)));
  return _json({ ok:true, items: items.slice(0, 50) });
}

// ---------- EDITS / REVISIONS ----------
function _editArticle(b){
  if (!b.id || !b.editorId) throw new Error("Missing id or editorId");
  const sh = _sh(SHEET.ARTICLES);
  const idx = _indexByHeader(sh);
  const range = sh.getRange(2,1,Math.max(sh.getLastRow()-1,0), sh.getLastColumn());
  const rows = range.getValues();
  let foundRow = -1;
  for (let i=0;i<rows.length;i++){
    if (rows[i][idx.id] === b.id){ foundRow = i; break; }
  }
  if (foundRow < 0) throw new Error("not found");

  const old = rows[foundRow];
  const oldBody = JSON.parse(old[idx.contentJson]||"{}").body || "";
  const newContent = { fields: b.fields||{}, body: b.body||"" };
  const diff = diffText(oldBody, b.body||"");
  const updatedAt = _now();

  // update cells
  rows[foundRow][idx.title] = b.title;
  rows[foundRow][idx.type] = b.type;
  rows[foundRow][idx.updatedAt] = updatedAt;
  rows[foundRow][idx.contentJson] = JSON.stringify(newContent);
  rows[foundRow][idx.contentText] = (b.title+" "+(b.body||"")).toLowerCase();
  rows[foundRow][idx.categories] = (b.categories||[]).join(",");
  range.setValues(rows);

  // add revision row
  const revSh = _sh(SHEET.REVISIONS);
  revSh.appendRow([_uuid(), b.id, b.editorId, b.summary||"", JSON.stringify(diff), updatedAt]);

  // fetch slug
  const slug = rows[foundRow][idx.slug];
  return _json({ ok:true, slug });
}

function diffText(oldText, newText){
  // Very simple line-based diff
  const oldArr = (oldText||"").split('\n');
  const newArr = (newText||"").split('\n');
  const max = Math.max(oldArr.length, newArr.length);
  const changes = [];
  for (let i=0;i<max;i++){
    const a = oldArr[i]||""; const b = newArr[i]||"";
    if (a !== b) changes.push({ line: i+1, from: a, to: b });
  }
  return changes;
}

function _revisions(articleId){
  const sh = _sh(SHEET.REVISIONS);
  const idx = _indexByHeader(sh);
  const rows = _rows(sh).filter(r => r[idx.articleId] === articleId);
  // join with USERS to get names
  const uidx = _indexByHeader(_sh(SHEET.USERS));
  const urows = _rows(_sh(SHEET.USERS));
  const usersById = {};
  urows.forEach(u => usersById[u[uidx.id]] = u[uidx.name] || u[uidx.username] || u[uidx.email]);
  const items = rows.sort((a,b)=> new Date(b[idx.createdAt]) - new Date(a[idx.createdAt]))
    .map(r => ({ id:r[idx.id], editorId:r[idx.editorId], editorName: usersById[r[idx.editorId]],
                 summary:r[idx.summary], diff: r[idx.diff], createdAt:r[idx.createdAt] }));
  return _json({ ok:true, items });
}

// ---------- COMMENTS ----------
function _addComment(b){
  if (!b.articleId || !b.authorId || !b.body) throw new Error("Missing fields");
  const sh = _sh(SHEET.COMMENTS);
  sh.appendRow([_uuid(), b.articleId, b.authorId, b.body, _now()]);
  return _json({ ok:true });
}
function _comments(articleId){
  const sh = _sh(SHEET.COMMENTS);
  const idx = _indexByHeader(sh);
  const rows = _rows(sh).filter(r => r[idx.articleId] === articleId);
  // join with USERS
  const uidx = _indexByHeader(_sh(SHEET.USERS));
  const urows = _rows(_sh(SHEET.USERS));
  const usersById = {};
  urows.forEach(u => usersById[u[uidx.id]] = u[uidx.name] || u[uidx.username] || u[uidx.email]);
  const items = rows.sort((a,b)=> new Date(a[idx.createdAt]) - new Date(b[idx.createdAt]))
    .map(r => ({ id:r[idx.id], authorId:r[idx.authorId], authorName:usersById[r[idx.authorId]], body:r[idx.body], createdAt:r[idx.createdAt] }));
  return _json({ ok:true, items });
}

// ---------- CATEGORIES ----------
function _categories(){
  const sh = _sh(SHEET.CATEGORIES);
  const idx = _indexByHeader(sh);
  const rows = _rows(sh);
  const items = rows.map(r => r[idx.name]).filter(Boolean);
  return _json({ ok:true, items });
}

// ---------- Util ----------
function slugify(s){
  return (s||"").toString().toLowerCase().trim()
    .replace(/[\s_]+/g,'-').replace(/[^a-z0-9\-]/g,'').replace(/\-+/g,'-');
}
