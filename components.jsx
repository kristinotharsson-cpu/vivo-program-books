// Vivo Program Book — UI primitives & utility components

const { useState, useEffect, useRef, useMemo, useCallback } = React;

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
    case "share": return <svg viewBox="0 0 24 24" {...s}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>;
    case "list": return <svg viewBox="0 0 24 24" {...s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case "moon": return <svg viewBox="0 0 24 24" {...s}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case "type": return <svg viewBox="0 0 24 24" {...s}><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
    case "edit": return <svg viewBox="0 0 24 24" {...s}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case "check": return <svg viewBox="0 0 24 24" {...s}><polyline points="5,13 10,18 20,7"/></svg>;
    case "image": return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><polyline points="3,18 9,13 14,17 21,11"/></svg>;
    case "download": return <svg viewBox="0 0 24 24" {...s}><path d="M12 4v12"/><polyline points="6,12 12,18 18,12"/><line x1="4" y1="20" x2="20" y2="20"/></svg>;
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
const Editable = ({ value, onChange, multiline = false, as = "span", ...rest }) => {
  const ref = useRef(null);
  const editing = window.__editMode;

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  const handleBlur = () => {
    if (ref.current) onChange(ref.current.innerText);
  };
  const handleKey = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      ref.current.blur();
    }
  };

  const Tag = as;
  return (
    <Tag
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKey}
      spellCheck={false}
      {...rest}
    >{value}</Tag>
  );
};

// ---------- Top Bar ----------
const TopBar = ({ title, onBack, onMenu, onSearch, showLogo, logoSrc, home }) => (
  <header className={"topbar" + (home ? " is-home" : "")}>
    <div className="topbar-left">
      {onBack ? (
        <button className="topbar-back" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" size={22} />
        </button>
      ) : null}
      {showLogo && logoSrc ? (
        <img src={logoSrc} alt="Vivo" className="topbar-logo" />
      ) : home ? (
        <span className="topbar-title sr-only">Vivo</span>
      ) : (
        <span className="topbar-title">{title}</span>
      )}
    </div>
    <div className="topbar-right">
      <button className="topbar-icon-btn" onClick={onSearch} aria-label="Search"><Icon name="search" /></button>
      <button className="topbar-icon-btn" onClick={onMenu} aria-label="Menu"><Icon name="menu" /></button>
    </div>
  </header>
);

// ---------- Settings Menu ----------
const SettingsMenu = ({ open, onClose, theme, onTheme, fontSize, onFontSize, onShare, onToggleEdit, editing }) => {
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
          <span className="label">{theme === "dark" ? "Cream Mode" : "Black Mode"}</span>
          <Icon name="moon" size={16} />
        </button>
        <button className="menu-item" onClick={onShare}>
          <span className="label">Share Program</span>
          <Icon name="share" size={16} />
        </button>
        <button className="menu-item" onClick={onToggleEdit}>
          <span className="label">{editing ? "Stop Editing" : "Edit Content"}</span>
          <Icon name={editing ? "check" : "edit"} size={16} />
        </button>
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
  if (!window.__editMode) return null;
  return (
    <div className="row-ctrls" contentEditable={false}>
      {onMoveUp ? <button className="row-ctrl" onClick={onMoveUp} aria-label={"Move " + label + " up"}>↑</button> : null}
      {onMoveDown ? <button className="row-ctrl" onClick={onMoveDown} aria-label={"Move " + label + " down"}>↓</button> : null}
      <button className="row-ctrl row-ctrl-del" onClick={onDelete} aria-label={"Delete " + label}>×</button>
    </div>
  );
};

const AddRowButton = ({ onAdd, label = "Add row" }) => {
  if (!window.__editMode) return null;
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
  const editing = window.__editMode;
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

// Expose globally for other Babel scripts
Object.assign(window, { Icon, Editable, TopBar, SettingsMenu, Toast, SectionBottomNav, RowControls, AddRowButton, PhotoSlot });
