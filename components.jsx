// Vivo Program Book — UI primitives & utility components

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useEditMode } from './edit-mode-context.jsx';

// ---------- Icons (inline SVG, Lucide-style stroke) ----------
const Icon = ({ name, size = 20 }) => {
  const s = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "menu": return <svg viewBox="0 0 24 24" {...s}><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>;
    case "search": return <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>;
    case "x": return <svg viewBox="0 0 24 24" {...s}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>;
    case "arrow-left": return <svg viewBox="0 0 24 24" {...s}><line x1="20" y1="12" x2="4" y2="12"/><polyline points="10,18 4,12 10,6"/></svg>;
    case "arrow-right": return <svg viewBox="0 0 24 24" {...s}><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14,6 20,12 14,18"/></svg>;
    case "chev-down": return <svg viewBox="0 0 24 24" {...s}><polyline points="6,9 12,15 18,9"/></svg>;
    case "chev-up": return <svg viewBox="0 0 24 24" {...s}><polyline points="6,15 12,9 18,15"/></svg>;
    case "copy": return <svg viewBox="0 0 24 24" {...s}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>;
    case "trash": return <svg viewBox="0 0 24 24" {...s}><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>;
    case "undo": return <svg viewBox="0 0 24 24" {...s}><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>;
    case "redo": return <svg viewBox="0 0 24 24" {...s}><path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/></svg>;
    case "monitor": return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>;
    case "phone": return <svg viewBox="0 0 24 24" {...s}><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>;
    case "chev-left": return <svg viewBox="0 0 24 24" {...s}><polyline points="15,18 9,12 15,6"/></svg>;
    case "chev-right": return <svg viewBox="0 0 24 24" {...s}><polyline points="9,18 15,12 9,6"/></svg>;
    case "share": return <svg viewBox="0 0 24 24" {...s}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>;
    case "grid": return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case "plus": return <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "list": return <svg viewBox="0 0 24 24" {...s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case "moon": return <svg viewBox="0 0 24 24" {...s}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case "type": return <svg viewBox="0 0 24 24" {...s}><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
    case "edit": return <svg viewBox="0 0 24 24" {...s}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case "check": return <svg viewBox="0 0 24 24" {...s}><polyline points="5,13 10,18 20,7"/></svg>;
    case "image": return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><polyline points="3,18 9,13 14,17 21,11"/></svg>;
    case "download": return <svg viewBox="0 0 24 24" {...s}><path d="M12 4v12"/><polyline points="6,12 12,18 18,12"/><line x1="4" y1="20" x2="20" y2="20"/></svg>;
    case "upload": return <svg viewBox="0 0 24 24" {...s}><path d="M12 16V4"/><polyline points="6,8 12,4 18,8"/><line x1="4" y1="20" x2="20" y2="20"/></svg>;
    case "sliders": return <svg viewBox="0 0 24 24" {...s}><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="8" r="2.5"/><circle cx="15" cy="16" r="2.5"/></svg>;
    case "eye": return <svg viewBox="0 0 24 24" {...s}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eye-off": return <svg viewBox="0 0 24 24" {...s}><path d="M3 3l18 18"/><path d="M10.5 6.4A10 10 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.4 4.3"/><path d="M6.6 6.6A16 16 0 0 0 2 12s3.5 6 10 6a10 10 0 0 0 4.5-1"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/></svg>;
    case "instagram": return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>;
    case "facebook": return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>;
    case "youtube": return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none"><path d="M23 12s0-3.2-.41-4.73a2.5 2.5 0 0 0-1.76-1.77C19.29 5.1 12 5.1 12 5.1s-7.29 0-8.83.4a2.5 2.5 0 0 0-1.76 1.77C1 8.8 1 12 1 12s0 3.2.41 4.73a2.5 2.5 0 0 0 1.76 1.77c1.54.4 8.83.4 8.83.4s7.29 0 8.83-.4a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>;
    case "linkedin": return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>;
    default: return null;
  }
};

// ---------- Editable text ----------
// Wraps text in a contentEditable when edit mode is on.
// Link protocol: write [label](https://url) in any text field; in read mode it
// renders as a real link. In edit mode you see the raw [label](url) to edit.
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|Program Book\.html[^\s)]*|#[^\s)]*)\)/g;
const hasLinks = (t) => typeof t === "string" && /\[[^\]]+\]\((https?:\/\/|Program Book\.html|#)/.test(t);
const linkifyHtml = (t) => {
  const esc = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = ""; let last = 0; let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(t))) {
    out += esc(t.slice(last, m.index));
    const ext = /^https?:/.test(m[2]);
    out += `<a href="${esc(m[2])}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  out += esc(t.slice(last));
  return out;
};

const Editable = ({ value, onChange, multiline = false, rich = null, as = "span", ...rest }) => {
  value = (value == null) ? "" : value;
  const ref = useRef(null);
  const editing = useEditMode();
  // Rich text (bold/italic/underline/color/highlight/links) is enabled on ALL editable
  // fields by default; pass rich={false} only where inline HTML would break structure.
  const isRich = rich === null ? true : rich;
  // Rich values may carry inline HTML tags; plain values are text with legacy [label](url) links.
  const isHtml = (t) => typeof t === "string" && /<(b|strong|i|em|u|mark|a|span|br)\b/i.test(t);

  useEffect(() => {
    if (!ref.current) return;
    if (isRich && (isHtml(value) || (editing && ref.current.dataset.richSeeded !== "1"))) {
      if (ref.current.innerHTML !== (value || "")) ref.current.innerHTML = value || "";
      ref.current.dataset.richSeeded = "1";
    } else if (!isRich && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value, isRich, editing]);

  const handleBlur = () => {
    if (!ref.current) return;
    if (isRich) {
      const html = window.VivoRich ? window.VivoRich.clean(ref.current.innerHTML) : ref.current.innerHTML;
      onChange(html);
    } else {
      onChange(ref.current.innerText);
    }
  };
  const handleKey = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      ref.current.blur();
    }
  };

  const Tag = as;
  const cls = (rest.className ? rest.className + " " : "") + (isRich && editing ? "rich-editable" : "");
  const props = { ...rest, className: cls || undefined };
  // Read mode: render inline HTML (rich) or legacy-link-parsed text.
  if (!editing) {
    if (isRich && isHtml(value)) return <Tag {...props} dangerouslySetInnerHTML={{ __html: value }} />;
    if (hasLinks(value)) return <Tag {...props} dangerouslySetInnerHTML={{ __html: linkifyHtml(value) }} />;
    return <Tag {...props}>{value}</Tag>;
  }
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKey}
      data-rich={isRich ? "1" : undefined}
      spellCheck={false}
      {...props}
    >{isRich ? undefined : value}</Tag>
  );
};

// ---------- Plain field (label + real input) ----------
// Used wherever the value is data, not prose — dates, times, venues, names, URLs.
// A real <input> keeps every space, comma, and period the editor types; contentEditable
// collapses whitespace, which is why these fields are not rich-text.
const PlainField = ({ label, value, placeholder, onChange, multiline = false, className = "", hint }) => (
  <label className={"plain-field" + (className ? " " + className : "")} contentEditable={false}>
    {label ? <span className="plain-field-label">{label}</span> : null}
    {multiline ? (
      <textarea className="plain-field-input" value={value == null ? "" : value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input type="text" className="plain-field-input" value={value == null ? "" : value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    )}
    {hint ? <span className="plain-field-hint">{hint}</span> : null}
  </label>
);

// Link back to the season index (never shown in the exported, standalone book)
const IndexLink = ({ compact }) => {
  if (window.VIVO_PROGRAM_DATA_SNAPSHOT) return null;
  return (
    <a className={"index-link" + (compact ? " is-compact" : "")} href="index.html" aria-label="All programs">
      <Icon name="grid" size={17} /><span>All programs</span>
    </a>
  );
};

// ---------- Contents dropdown (shared by the reader nav and the edit-mode bar) ----------
const ContentsMenu = ({ sections = [], currentId, onGo, onHome, onSearch }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const wrapRef = useRef(null);
  useEffect(() => { if (!open) setFilter(""); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const jump = (id) => { setOpen(false); if (id === "__home") onHome && onHome(); else onGo && onGo(id); };
  return (
    <div className="reader-nav-contents" ref={wrapRef}>
      <button className="reader-nav-contents-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Icon name="list" size={18} /><span>Contents</span><Icon name="chev-down" size={16} />
      </button>
      {open ? (
        <div className="reader-nav-menu" role="menu">
          <div className="reader-nav-filter">
            <Icon name="search" size={15} />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter contents…" aria-label="Filter contents" />
          </div>
          {!filter ? (
            <button className={"reader-nav-jump" + (!currentId ? " is-current" : "")} onClick={() => jump("__home")}>
              <span className="num">00</span><span className="ttl">Cover</span>
            </button>
          ) : null}
          {sections.filter(s => !filter || (s.title || "").toLowerCase().includes(filter.toLowerCase())).map((s) => {
            const n = sections.indexOf(s) + 1;
            return (
              <button key={s.id} className={"reader-nav-jump" + (currentId === s.id ? " is-current" : "")} onClick={() => jump(s.id)}>
                <span className="num">{String(n).padStart(2, "0")}</span><span className="ttl">{s.title}</span>
              </button>
            );
          })}
          {filter && !sections.some(s => (s.title || "").toLowerCase().includes(filter.toLowerCase())) ? (
            <div className="reader-nav-empty">No section matches. <button className="reader-nav-fullsearch" onClick={() => { setOpen(false); onSearch && onSearch(); }}>Search full text →</button></div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

// ---------- Top Bar ----------
const TopBar = ({ title, onBack, onMenu, onSearch, showLogo, logoSrc, home, sections, currentId, onGo, onHome }) => (
  <header className={"topbar" + (home ? " is-home" : "")}>
    <div className="topbar-left">
      {onBack ? (
        <button className="topbar-back" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" size={22} />
        </button>
      ) : null}
      <IndexLink compact />
      {showLogo && logoSrc ? (
        <img src={logoSrc} alt="Vivo" className="topbar-logo" />
      ) : home ? (
        <span className="topbar-title sr-only">Vivo</span>
      ) : (
        <span className="topbar-title">{title}</span>
      )}
    </div>
    <div className="topbar-right">
      <ContentsMenu sections={sections} currentId={currentId} onGo={onGo} onHome={onHome} onSearch={onSearch} />
      <button className="topbar-icon-btn" onClick={onSearch} aria-label="Search"><Icon name="search" /></button>
      <button className="topbar-icon-btn" onClick={onMenu} aria-label="Menu"><Icon name="menu" /></button>
    </div>
  </header>
);

// ---------- Reader Nav (reader-facing only: preview + exported HTML) ----------
// Sticky bar with a link back to the main Vivo site, a Contents jump menu, and search.
// Never rendered while editing.
const ReaderNav = ({ sections = [], onGo, onHome, onBack, onSearch, onMenu, theme, homeUrl = "https://vivoperformingarts.org", currentId, currentTitle }) => {
  const logoSrc = theme === "light" ? "assets/logos/vivo-logo-black.png" : "assets/logos/vivo-logo-cream.png";
  return (
    <header className="reader-nav">
      <div className="reader-nav-left">
        {onBack ? (
          <button className="reader-nav-back" onClick={onBack} aria-label="Back to cover"><Icon name="arrow-left" size={20} /></button>
        ) : null}
        <a className="reader-nav-brand" href={homeUrl} target="_blank" rel="noopener noreferrer" aria-label="Vivo Performing Arts website">
          <img src={logoSrc} alt="Vivo Performing Arts" />
          <span className="reader-nav-ext" aria-hidden="true">↗</span>
        </a>
        <IndexLink />
      </div>
      {currentTitle ? <div className="reader-nav-current" aria-hidden="true">{currentTitle}</div> : null}
      <div className="reader-nav-right">
        <ContentsMenu sections={sections} currentId={currentId} onGo={onGo} onHome={onHome} onSearch={onSearch} />
        <button className="reader-nav-icon" onClick={onSearch} aria-label="Search this program"><Icon name="search" size={20} /></button>
        {onMenu ? <button className="reader-nav-icon" onClick={onMenu} aria-label="Menu"><Icon name="menu" size={20} /></button> : null}
      </div>
    </header>
  );
};

// ---------- PDF import (reusable across modules) ----------
// A friendly "Import from PDF" affordance. The section supplies onImport(file) to append
// parsed entries. Real extraction runs on deploy; preview appends a starter set.
const PdfImport = ({ label = "Import from PDF", hint, onImport }) => {
  const editing = useEditMode();
  if (!editing) return null;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const fileRef = useRef(null);
  const take = (file) => {
    if (!file) return;
    setBusy("Reading “" + file.name + "”…");
    Promise.resolve(onImport(file)).finally(() => {
      setBusy(""); setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    });
  };
  if (!open) return <button className="pdf-import-btn" onClick={() => setOpen(true)}>⇪ {label}</button>;
  return (
    <div className="pdf-import" contentEditable={false}>
      <div className="pdf-import-help">{hint || "Upload a printed PDF and we'll read the entries into the fields above — fine-tune anything after. Real extraction runs on import."}</div>
      <div className="pdf-import-drop" onClick={() => fileRef.current && fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files && e.dataTransfer.files[0]); }}>
        {busy || "Click to choose a PDF, or drop it here"}
      </div>
      <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => take(e.target.files && e.target.files[0])} />
      <div className="pdf-import-actions"><button onClick={() => { setOpen(false); setBusy(""); }}>Cancel</button></div>
    </div>
  );
};

// ---------- Shared-content notice (edit mode, versioned shared modules) ----------
// Warns editors that changes to shared institutional content apply to programs from this
// program's date forward — never to earlier-dated books.
const SharedNotice = () => {
  const editing = useEditMode();
  if (!editing) return null;
  const d = window.PROGRAM_DATA && window.PROGRAM_DATA.cover && window.PROGRAM_DATA.cover.date;
  return (
    <div className="shared-notice" contentEditable={false}>
      <span className="shared-notice-dot">◆</span>
      Shared content — edits apply to programs dated {d ? <strong>{d}</strong> : "today"} and later. Earlier books keep their saved version.
    </div>
  );
};

// ---------- Settings Menu ----------
const SettingsMenu = ({ open, onClose, theme, onTheme, fontSize, onFontSize, onShare, onToggleEdit, editing, onImport, onExport, onDesign }) => {
  if (!open) return null;
  return (
    <>
      <div className="menu-overlay" onClick={onClose} />
      <div className="menu-sheet" role="menu">
        <div style={{ padding: "10px 18px 4px" }}>
          <div className="label" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "var(--fg-muted)" }}>Text Size</div>
        </div>
        <div className="fontsize-toggle">
          {[
            ["S", 14],
            ["M", 16],
            ["L", 18],
            ["XL", 20]
          ].map(([label, val]) => (
            <button key={val} className={fontSize === val ? "is-active" : ""} onClick={() => onFontSize(val)}>{label}</button>
          ))}
        </div>
        <button className="menu-item" onClick={() => onTheme(theme === "dark" ? "light" : "dark")}>
          <span className="label">{theme === "dark" ? "Switch to Cream" : "Switch to Black"}</span>
          <Icon name="moon" size={16} />
        </button>
        {!window.VIVO_PROGRAM_DATA_SNAPSHOT ? (
          <a className="menu-item" href="index.html">
            <span className="label">All Programs</span>
            <Icon name="grid" size={16} />
          </a>
        ) : null}
        <button className="menu-item" onClick={onShare}>
          <span className="label">Share Program</span>
          <Icon name="share" size={16} />
        </button>
        <button className="menu-item" onClick={onToggleEdit}>
          <span className="label">{editing ? "Stop Editing" : "Edit Content"}</span>
          <Icon name={editing ? "check" : "edit"} size={16} />
        </button>
        {onDesign ? (
          <button className="menu-item" onClick={onDesign}>
            <span className="label">Design Settings</span>
            <Icon name="sliders" size={16} />
          </button>
        ) : null}
        {onImport ? (
          <button className="menu-item" onClick={onImport}>
            <span className="label">Import PDF</span>
            <Icon name="upload" size={16} />
          </button>
        ) : null}
        {onExport ? (
          <button className="menu-item" onClick={onExport}>
            <span className="label">Export HTML</span>
            <Icon name="download" size={16} />
          </button>
        ) : null}
      </div>
    </>
  );
};

// ---------- Toast ----------
const Toast = ({ msg }) => msg ? <div className="toast">{msg}</div> : null;

// ---------- Section bottom nav ----------
const SectionBottomNav = ({ prev, next, onGo }) => {
  if (!prev && !next) return null;
  return (
    <nav className="section-bottom-nav">
      <button onClick={() => prev && onGo(prev.id)} disabled={!prev} style={{ visibility: prev ? "visible" : "hidden" }}>
        <div className="dir">← Previous</div>
        <div className="name">{prev?.title || ""}</div>
      </button>
      <button onClick={() => next && onGo(next.id)} disabled={!next} style={{ visibility: next ? "visible" : "hidden" }}>
        <div className="dir">Next →</div>
        <div className="name">{next?.title || ""}</div>
      </button>
    </nav>
  );
};

// ---------- Row Controls (delete an item, edit-mode only) ----------
const RowControls = ({ onDelete, onMoveUp, onMoveDown, label = "row" }) => {
  const editing = useEditMode();
  if (!editing) return null;
  return (
    <div className="row-ctrls" contentEditable={false}>
      {onMoveUp ? <button className="row-ctrl" onClick={onMoveUp} aria-label={"Move " + label + " up"}>↑</button> : null}
      {onMoveDown ? <button className="row-ctrl" onClick={onMoveDown} aria-label={"Move " + label + " down"}>↓</button> : null}
      <button className="row-ctrl row-ctrl-del" onClick={onDelete} aria-label={"Delete " + label}>×</button>
    </div>
  );
};

const AddRowButton = ({ onAdd, label = "Add row" }) => {
  const editing = useEditMode();
  if (!editing) return null;
  return (
    <button className="add-row-btn" onClick={onAdd}>
      <span aria-hidden="true">+</span>
      <span>{label}</span>
    </button>
  );
};

// ---------- Photo Slot (upload-on-click in edit mode) ----------
const PhotoSlot = ({ src, initials = "", alt = "", className = "", onChange, onClear, size = 64, fill = false }) => {
  const fileRef = useRef(null);
  const editing = useEditMode();
  const handleClick = (e) => {
    if (!editing) return;
    e.stopPropagation();
    fileRef.current?.click();
  };
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onChange?.(String(reader.result || ""));
    reader.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <div
      className={"photo-slot" + (fill ? " photo-slot-fill" : "") + (editing ? " is-editable" : "") + (src ? " has-photo" : "") + (className ? " " + className : "")}
      style={fill ? undefined : { width: size, height: size, flex: "0 0 " + size + "px" }}
      onClick={handleClick}
      role={editing ? "button" : undefined}
      aria-label={editing ? "Change photo" : undefined}
    >
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <span className="photo-slot-initials">{initials}</span>
      )}
      {editing ? (
        <span className="photo-slot-overlay">
          <Icon name="image" size={Math.max(14, size * 0.22)} />
          <span>{src ? "Replace" : "Add"}</span>
        </span>
      ) : null}
      {editing && src && onClear ? (
        <button
          className="photo-slot-clear"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          aria-label="Remove photo"
        >×</button>
      ) : null}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
};

export { Icon, Editable, PlainField, IndexLink, ContentsMenu, TopBar, ReaderNav, PdfImport, SharedNotice, SettingsMenu, Toast, SectionBottomNav, RowControls, AddRowButton, PhotoSlot };
