# Netlify Blobs setup — Vivo Program Books

The app already ships with everything it needs: `storage.js` (client adapter), `netlify/functions/programs.mjs` (the Blobs API), `netlify.toml`, and `package.json`. The adapter auto-detects: on Netlify it uses Blobs; anywhere else it falls back to localStorage. No code changes needed when you deploy.

## One-time setup (~10 minutes)

1. **Push the project to GitHub** (the repo you already have: `vivo-program-books`). Make sure these files are included: `netlify.toml`, `package.json`, `netlify/functions/programs.mjs`, `storage.js`.

2. **Create the Netlify site**
   - Go to https://app.netlify.com → "Add new site" → "Import an existing project"
   - Pick GitHub → authorize → select `vivo-program-books`
   - Build settings: leave build command EMPTY, publish directory `.` (already set by netlify.toml)
   - Click Deploy

3. **That's it for Blobs.** Netlify Blobs requires no extra configuration — no database to create, no keys to copy. The function gets access automatically on any paid or free plan (Blobs is included).

4. **Verify it works**
   - Open `https://<your-site>.netlify.app/.netlify/functions/programs?op=ping` → should say `ok`
   - Open the season index, click into a show, edit some text
   - Open the same show in a different browser / phone → your edit is there. That's Blobs.

## How it behaves

- Every edit in a program auto-saves (debounced ~1s) to a Blob keyed `program-<slug>`
- Status lifecycle: `empty` (never edited) → `draft` (edited) → `published` (HTML exported at least once)
- The library page reads Blob statuses and shows Empty / Draft / Published badges with "last edited"
- If a Blob is deleted, the shell JSON in `shows/` is intact — content can be re-imported

## Local development note

When you open the files locally or in this design tool, there is no Netlify function, so the adapter quietly uses localStorage. Same code, same behavior, single-browser persistence only.
