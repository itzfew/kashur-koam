# Kashurpedia (Apps Script + Google Sheets + Vercel)

A lightweight Wikipedia-style app where users can **read**, **submit**, **edit**, and **comment** on articles. 
Auth is simple email/username/name. All data is stored in **Google Sheets** via a **Google Apps Script** web app.

## Architecture
- Frontend: static HTML/CSS/JS (deploy to **Vercel** or any static host)
- Backend: **Google Apps Script** exposing JSON endpoints
- Storage: **Google Sheets**
- Auth: minimal (email + username + name), stored in `USERS` sheet
- Revisions: every edit is an entry in `REVISIONS` sheet with a simple text diff
- Comments: stored in `COMMENTS`
- Articles: stored in `ARTICLES` as structured JSON (infobox fields) + plain text for search

## Sheets
Create a Google Spreadsheet with the following sheets (first row = headers):

### USERS
id | email | username | name | createdAt

### ARTICLES
id | slug | title | type | authorId | createdAt | updatedAt | contentJson | contentText | categories

### REVISIONS
id | articleId | editorId | summary | diff | createdAt

### COMMENTS
id | articleId | authorId | body | createdAt

### CATEGORIES
name

> After creating, deploy the Apps Script from `backend/Code.gs` as a **Web App** (Anyone can access). Copy the deployment URL and put it into `frontend/config.js` as `GAS_URL`.

## Local quick run (frontend)
Open `frontend/index.html` with Live Server or deploy to Vercel.

## Vercel deploy
- Create a new project, import the `frontend/` folder.
- Framework preset: **Other**
- Output directory: `frontend`
- No build step required.

## Security note
This is an MVP for educational/demo use. For production:
- Add proper auth (tokens, session validation, rate limiting)
- Validate/sanitize inputs server-side
- Lock down the Apps Script to restrict who can POST/endpoints per action
