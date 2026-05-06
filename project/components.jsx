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
const SettingsMenu = ({ open, onClose, theme, onTheme, fontSize, onFontSize, onShare, onToggleEdit, editing, onSaveJson, onLoadJson, onCustomize, onImportPdf }) => {
  const fileRef = useRef(null);
  const pdfRef = useRef(null);
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
        {onCustomize && (
          <button className="menu-item" onClick={() => { onCustomize(); onClose(); }}>
            <span className="label">Design Options</span>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
          </button>
        )}
        {onSaveJson && (
          <button className="menu-item" onClick={() => { onSaveJson(); onClose(); }}>
            <span className="label">Save as JSON</span>
            <Icon name="download" size={16} />
          </button>
        )}
        {onLoadJson && (
          <>
            <button className="menu-item" onClick={() => fileRef.current?.click()}>
              <span className="label">Load from file</span>
              <Icon name="image" size={16} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { onLoadJson(f); onClose(); }
                e.target.value = "";
              }}
            />
          </>
        )}
        {onImportPdf && (
          <>
            <button className="menu-item" onClick={() => pdfRef.current?.click()}>
              <span className="label">Import from PDF</span>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
            </button>
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { onImportPdf(f); onClose(); }
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

// ---------- Toast ----------
const Toast = ({ msg, onClose }) => {
  if (!msg) return null;
  return (
    <div className={"toast" + (onClose ? " toast--error" : "")}>
      <span>{msg}</span>
      {onClose ? <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button> : null}
    </div>
  );
};

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
const PhotoSlot = ({ src, initials = "", alt = "", className = "", onChange, onClear, size = 64 }) => {
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
  const handleUrl = (e) => {
    e.stopPropagation();
    const url = prompt("Paste an image URL:");
    if (url && url.trim()) onChange?.(url.trim());
  };
  return (
    <div
      className={"photo-slot" + (editing ? " is-editable" : "") + (src ? " has-photo" : "") + (className ? " " + className : "")}
      style={{ width: size, height: size, flex: "0 0 " + size + "px" }}
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
      {editing && size >= 56 ? (
        <button className="photo-url-btn" onClick={handleUrl} aria-label="Use image URL">URL</button>
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

// ---------- Design Options (Tweaks) Panel ----------
const TweaksPanel = ({ onClose, children }) => (
  <>
    <div className="tweaks-overlay" onClick={onClose} />
    <aside className="tweaks-panel" role="dialog" aria-label="Design Options">
      <div className="tweaks-header">
        <span>Design Options</span>
        <button className="tweaks-close" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <div className="tweaks-body">{children}</div>
    </aside>
  </>
);

const TweakSection = ({ label, children }) => (
  <div className="tweak-section">
    <div className="tweak-section-label">{label}</div>
    {children}
  </div>
);

const TweakSelect = ({ label, value, options, onChange }) => (
  <div className="tweak-row">
    <label className="tweak-label">{label}</label>
    <select className="tweak-select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TweakRadio = ({ label, value, options, onChange }) => (
  <div className="tweak-row tweak-row--radio">
    <div className="tweak-label">{label}</div>
    <div className="tweak-radios">
      {options.map(o => (
        <label key={o.value} className={"tweak-radio-opt" + (value === o.value ? " is-active" : "")}>
          <input type="radio" name={label} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  </div>
);

const TweakToggle = ({ label, value, onChange }) => (
  <div className="tweak-row tweak-row--toggle">
    <span className="tweak-label">{label}</span>
    <button
      className={"tweak-toggle" + (value ? " is-on" : "")}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="tweak-toggle-knob" />
    </button>
  </div>
);

const TweakButton = ({ label, onClick }) => (
  <button className="tweak-btn" onClick={onClick}>{label}</button>
);

// Expose globally for other Babel scripts
Object.assign(window, { Icon, Editable, TopBar, SettingsMenu, Toast, SectionBottomNav, RowControls, AddRowButton, PhotoSlot, TweaksPanel, TweakSection, TweakSelect, TweakRadio, TweakToggle, TweakButton });
