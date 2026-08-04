import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app.jsx';
import { VivoStore } from './storage.ts';
import { PROGRAM_DATA as SAMPLE_DATA } from './data.js';
import './editor-suite.js';

window.VivoStore = VivoStore;

function resolveShared(shared, dateStr) {
  try {
    if (!shared || !VivoStore.resolveVersion) return shared;
    const dnum = VivoStore.parseDate(dateStr);
    if (shared.supporters) shared = { ...shared, supporters: VivoStore.resolveVersion('supporters', shared.supporters, dnum) };
    const rsb = VivoStore.resolveVersion('staffBoard', { staff: shared.staff, boards: shared.boards }, dnum);
    if (rsb) shared = { ...shared, staff: rsb.staff, boards: rsb.boards };
    if (shared.about) shared = { ...shared, about: VivoStore.resolveVersion('about', shared.about, dnum) };
    if (shared.audienceInfo) shared = { ...shared, audienceInfo: VivoStore.resolveVersion('audienceInfo', shared.audienceInfo, dnum) };
  } catch (e) {}
  return shared;
}

async function main() {
  const params = new URLSearchParams(location.search);
  let slug = params.get('show');
  if (!slug) {
    const m = location.pathname.match(/\/([a-z0-9][a-z0-9-]+)\/?$/);
    if (m && m[1] !== 'index' && !m[1].endsWith('.html')) slug = m[1];
  }

  await VivoStore.loadSharedFromBlobs();

  if (!slug) {
    const shared = await fetch('shows/_vivo-shared.json')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
    window.VIVO_SHARED = resolveShared(shared, SAMPLE_DATA.cover && SAMPLE_DATA.cover.date);
    window.PROGRAM_DATA = SAMPLE_DATA;
  } else {
    window.__VIVO_STORAGE_KEY = 'vivo-pb-data:' + slug;
    try {
      const [rec, shell, shared] = await Promise.all([
        VivoStore.getProgram(slug).catch(() => null),
        fetch('shows/' + slug + '.json').then(r => { if (!r.ok) throw new Error('not found'); return r.json(); }),
        fetch('shows/_vivo-shared.json').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      let data = shell;
      let usedRec = null;
      if (rec && shell && rec.contentVersion === shell.contentVersion && rec.data && rec.data.sections) {
        usedRec = rec;
        data = rec.data;
      }

      if (usedRec && shell && shell.cover) {
        data = { ...data, cover: { ...data.cover, venue: shell.cover.venue } };
        try {
          const shInfo = (shell.sections || []).find(s => s.kind === 'info');
          const dInfo = (data.sections || []).find(s => s.kind === 'info');
          if (shInfo && dInfo) {
            const shV = (shInfo.sections || []).find(x => /^venue$/i.test((x.h || '').trim()));
            const dV = (dInfo.sections || []).find(x => /^venue$/i.test((x.h || '').trim()));
            if (shV && dV) dV.body = shV.body;
          }
        } catch (e) {}
      }

      if (usedRec) window.VIVO_PROGRAM_RECORD = usedRec;
      window.VIVO_SHARED = resolveShared(shared, data.cover && data.cover.date);
      window.PROGRAM_DATA = data;
      document.title = data.cover.title + ' — Vivo Performing Arts';
    } catch (e) {
      document.getElementById('app').innerHTML =
        '<div style="font-family:Inter,sans-serif;max-width:520px;margin:80px auto;padding:32px;text-align:center;">' +
        '<h1 style="font-size:24px;margin:0 0 12px;">Show not found</h1>' +
        '<p style="color:#666;margin:0 0 24px;">No program for "<code>' + slug + '</code>".</p>' +
        '<a href="index.html" style="color:#BD2691;font-weight:600;">← Back to all programs</a>' +
        '</div>';
      return;
    }
  }

  console.log('[boot] App type:', typeof App, App);
  console.log('[boot] PROGRAM_DATA set:', !!window.PROGRAM_DATA);
  console.log('[boot] #app el:', document.getElementById('app'));
  ReactDOM.createRoot(document.getElementById('app')).render(<App />);
  console.log('[boot] render() called');
}

main();
