// Vivo Program Book — App shell, cover, TOC, search, routing

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA, useCallback: useCallbackA } = React;

// ---- Cover photo frame (16:9, brush watermark when empty) ----
const CoverPhotoFrame = ({ src, alt, brushSrc, onChange, onClear }) => {
  const fileRef = React.useRef(null);
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
      className={"cover-photo-hero" + (editing ? " is-editable" : "") + (src ? " has-photo" : "")}
      onClick={handleClick}
      role={editing ? "button" : undefined}
      aria-label={editing && !src ? "Add cover photo" : editing ? "Replace cover photo" : undefined}
    >
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <React.Fragment>
          <img className="cover-photo-hero-brush" src={brushSrc} alt="" aria-hidden="true" onError={(e) => e.target.style.display = "none"} />
          <span className="cover-photo-hero-placeholder">
            <span className="ratio">1920 × 1080</span>
            <span className="hint">{editing ? "Click to add photo" : "Photo"}</span>
          </span>
        </React.Fragment>
      )}
      {editing ? (
        <span className="cover-photo-hero-overlay" aria-hidden="true">
          {src ? "Replace photo" : "Add photo"}
        </span>
      ) : null}
      {editing && src && onClear ? (
        <button
          className="cover-photo-hero-clear"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          aria-label="Remove photo"
        >×</button>
      ) : null}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
};

// ---- Cover ----
const Cover = ({ cover, update, variant, brushColor, textColor, theme }) => {
  // Map accent name to css var
  const accentMap = {
    plum: "var(--vivo-plum)",
    tangerine: "var(--vivo-tangerine)",
    orange: "var(--vivo-orange)",
    blue: "var(--vivo-blue)",
    "sky-blue": "var(--vivo-sky-blue)",
    green: "var(--vivo-green)",
    "light-green": "var(--vivo-light-green)",
    lavender: "var(--vivo-lavender)",
    black: "var(--vivo-black)"
  };
  const bg = accentMap[cover.accent] || "var(--vivo-tangerine)";
  const autoFg = cover.accent === "light-green" || cover.accent === "lavender" ? "var(--vivo-black)" : "var(--vivo-cream)";
  const textColorMap = {
    cream: "var(--vivo-cream)",
    black: "var(--vivo-black)",
    plum: "var(--vivo-plum)",
    tangerine: "var(--vivo-tangerine)"
  };
  const fg = textColor && textColor !== "auto" ? (textColorMap[textColor] || autoFg) : autoFg;
  const brushSrc = `assets/illustrations/${cover.brush}-${brushColor}.png`;

  // Default variant: brush layout with 16:9 photo block in place of brush illustration
  if (variant === "default") {
    return (
      <section className="cover is-split is-photo-hero" style={{ background: bg, color: fg }}>
        <Editable as="div" className="cover-eyebrow" value={cover.eyebrow} onChange={v => update({ eyebrow: v })} />
        <Editable as="h1" className="cover-title" value={cover.title} onChange={v => update({ title: v })} />
        <Editable as="div" className="cover-subtitle" value={cover.subtitle} onChange={v => update({ subtitle: v })} />
        <div className="cover-hero-photo">
          <CoverPhotoFrame
            src={cover.photoSrc}
            alt={cover.photoCaption || ""}
            brushSrc={brushSrc}
            onChange={(src) => update({ photoSrc: src })}
            onClear={() => update({ photoSrc: "" })}
          />
        </div>
        <div className="cover-meta cover-meta-stack">
          <div className="cover-meta-row">
            <span className="label">Date</span>
            <Editable as="span" className="value" value={cover.date} onChange={v => update({ date: v })} />
          </div>
          <div className="cover-meta-row">
            <span className="label">Time</span>
            <Editable as="span" className="value" value={cover.time} onChange={v => update({ time: v })} />
          </div>
          <div className="cover-meta-row">
            <span className="label">Venue</span>
            <Editable as="span" className="value" value={cover.venue} onChange={v => update({ venue: v })} />
          </div>
        </div>
      </section>
    );
  }

  // Mono / split variants: original behavior (single brush)
  const isMono = variant === "mono";
  const isSplit = variant === "split";
  return (
    <section className={"cover" + (isMono ? " is-mono" : isSplit ? " is-split" : "")} style={{ background: bg, color: fg }}>
      <img className={"cover-brush tr" + (isMono ? " is-mono-brush" : "")} src={brushSrc} alt="" aria-hidden="true" onError={(e) => e.target.style.display = "none"} />
      <Editable as="div" className="cover-eyebrow" value={cover.eyebrow} onChange={v => update({ eyebrow: v })} />
      <Editable as="h1" className="cover-title" value={cover.title} onChange={v => update({ title: v })} />
      <Editable as="div" className="cover-subtitle" value={cover.subtitle} onChange={v => update({ subtitle: v })} />
      {isMono ? (
        <div className="cover-mono-photo">
          <PhotoSlot
            src={cover.photoSrc}
            initials="PHOTO"
            alt={cover.photoCaption || ""}
            size={140}
            onChange={(src) => update({ photoSrc: src })}
            onClear={() => update({ photoSrc: "" })}
          />
        </div>
      ) : null}
      <div className="cover-meta">
        <div>
          <span className="label">Date</span>
          <Editable as="div" value={cover.date} onChange={v => update({ date: v })} />
        </div>
        <div>
          <span className="label">Time</span>
          <Editable as="div" value={cover.time} onChange={v => update({ time: v })} />
        </div>
        <div>
          <span className="label">Venue</span>
          <Editable as="div" value={cover.venue} onChange={v => update({ venue: v })} />
        </div>
      </div>
    </section>
  );
};

// ---- Footer sponsor banner ----
const FooterSponsor = ({ sponsor }) => (
  <div className="footer-sponsor" style={{ backgroundColor: "#000000", color: "#fffbeb" }}>
    <div className="footer-sponsor-tag">In Partnership With</div>
    <div className="footer-sponsor-name">{sponsor.name}</div>
    <div className="footer-sponsor-line">{sponsor.line}</div>
  </div>
);

// ---- Note Callout (link card on home, between cover and TOC) ----
const NoteCallout = ({ label, name, photoSrc, initials, onClick, onPhotoChange, onPhotoClear }) => {
  const fileRef = React.useRef(null);
  const editing = window.__editMode;
  const handlePhotoClick = (e) => {
    if (!editing) return;
    e.stopPropagation();
    fileRef.current?.click();
  };
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onPhotoChange?.(String(reader.result || ""));
    reader.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <button className={"note-callout" + (editing ? " is-editing" : "")} onClick={onClick}>
      <div
        className={"note-callout-photo" + (editing ? " is-editable" : "")}
        onClick={handlePhotoClick}
        role={editing ? "button" : undefined}
        aria-label={editing ? "Change photo" : undefined}
      >
        {photoSrc ? <img src={photoSrc} alt="" /> : <span>{initials}</span>}
        {editing ? (
          <div className="note-callout-photo-overlay">
            <Icon name="image" size={18} />
            <span>{photoSrc ? "Change" : "Add photo"}</span>
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="note-callout-text">
        <div className="note-callout-label">{label}</div>
        <div className="note-callout-name">{name}</div>
      </div>
      {editing && photoSrc ? (
        <button
          className="note-callout-clear"
          onClick={(e) => { e.stopPropagation(); onPhotoClear?.(); }}
          aria-label="Remove photo"
        >
          <Icon name="x" size={14} />
        </button>
      ) : null}
      <Icon name="arrow-right" size={20} />
    </button>
  );
};

// ---- TOC ----
const TOC = ({ sections, onGo, variant, ads = [], highlightColor }) => {
  const cls = "toc-list" + (variant === "minimal" ? " is-minimal" : "");
  const highlightMap = {
    plum: "var(--vivo-plum)",
    tangerine: "var(--vivo-tangerine)",
    orange: "var(--vivo-orange)",
    blue: "var(--vivo-blue)",
    "sky-blue": "var(--vivo-sky-blue)",
    green: "var(--vivo-green)",
    "light-green": "var(--vivo-light-green)",
    lavender: "var(--vivo-lavender)",
    black: "var(--vivo-black)"
  };
  const highlight = highlightMap[highlightColor] || "var(--vivo-plum)";
  const onLight = highlightColor === "light-green" || highlightColor === "lavender";
  const highlightFg = onLight ? "var(--vivo-black)" : "var(--vivo-cream)";
  const tocStyle = { "--toc-highlight": highlight, "--toc-highlight-fg": highlightFg };
  // Inline ads slotted into TOC at intervals
  const items = [];
  sections.forEach((s, i) => {
    items.push({ kind: "section", section: s, idx: i });
    // After items 3 and 7, slot an ad if available
    if ((i === 2 || i === 6) && ads[Math.floor(i / 4)]) {
      items.push({ kind: "ad", ad: ads[Math.floor(i / 4)] });
    }
  });
  return (
    <section className="toc-section" style={tocStyle}>
      <div style={{ marginBottom: 0, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <h2 className="toc-heading">Table of Contents</h2>
      </div>
      <ol className={cls} style={{ marginTop: 16 }}>
        {items.map((item, i) => item.kind === "ad" ? (
          <li key={"ad-" + i} className="toc-ad-slot">
            <InlineAd ad={item.ad} />
          </li>
        ) : (
          <li key={item.section.id} className="toc-item">
            <button className="toc-link" onClick={() => onGo(item.section.id)}>
              <span className="num">{String(item.idx + 1).padStart(2, "0")}</span>
              <span className="title">{item.section.title}</span>
              <Icon name="arrow-right" size={20} />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};

// ---- Inline ad card ----
const InlineAd = ({ ad }) => (
  <a className="inline-ad" href={ad.href || "#"} target="_blank" rel="noopener noreferrer">
    <div className="inline-ad-tag">Sponsor</div>
    <div className="inline-ad-name">{ad.name}</div>
    <div className="inline-ad-tagline">{ad.tagline}</div>
    {ad.cta ? <div className="inline-ad-cta">{ad.cta} <Icon name="arrow-right" size={14} /></div> : null}
  </a>
);

// ---- Search ----
const useSearchIndex = (data) => useMemoA(() => {
  const idx = [];
  data.sections.forEach(sec => {
    const collect = (text, label) => {
      if (!text) return;
      idx.push({ sectionId: sec.id, sectionTitle: sec.title, label, text: String(text) });
    };
    collect(sec.title, "Title");
    collect(sec.eyebrow, "Eyebrow");
    if (sec.lead) collect(sec.lead, "Intro");
    if (sec.quote) collect(sec.quote, "Quote");
    (sec.body || []).forEach(t => collect(t, "Welcome"));
    (sec.pieces || []).forEach(p => {
      if (p.kind === "intermission") return;
      collect(`${p.composer} — ${p.work}`, "Program");
      if (p.meta) collect(p.meta, "Program");
      (p.movements || []).forEach(m => collect(m, "Movement"));
    });
    (sec.sections || []).forEach(sub => {
      collect(sub.h, "Heading");
      (sub.body || []).forEach(t => collect(t, sub.h));
    });
    (sec.cast || []).concat(sec.creative || []).forEach(c => collect(`${c.role}: ${c.name}`, "Cast"));
    (sec.groups || []).forEach(g => {
      collect(g.h, "Section");
      (g.players || []).forEach(p => collect(p, g.h));
    });
    (sec.bios || []).forEach(b => {
      collect(`${b.name} — ${b.role}`, "Bio");
      (b.body || []).forEach(t => collect(t, b.name));
    });
    (sec.tiers || []).forEach(t => {
      collect(t.name, "Tier");
      (t.names || []).forEach(n => collect(n, t.name));
    });
    (sec.events || []).forEach(e => collect(`${e.month} ${e.day} — ${e.title} — ${e.meta}`, "Upcoming"));
    (sec.ads || []).forEach(a => collect(`${a.name} — ${a.tagline}`, "Sponsor"));
  });
  return idx;
}, [data]);

const SearchOverlay = ({ open, onClose, data, onGo }) => {
  const [q, setQ] = useStateA("");
  const idx = useSearchIndex(data);
  if (!open) return null;
  const results = q.trim() ? idx.filter(r => r.text.toLowerCase().includes(q.toLowerCase())).slice(0, 30) : [];
  const highlight = (text) => {
    if (!q.trim()) return text;
    const re = new RegExp("(" + q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + ")", "gi");
    const parts = text.split(re);
    return parts.map((p, i) => re.test(p) ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>);
  };
  return (
    <div className="search-overlay">
      <div className="search-bar">
        <Icon name="search" size={22} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search the program..." />
        <button className="topbar-icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
      </div>
      <div className="search-results">
        {q.trim() === "" ? (
          <div className="search-empty">Search composers, works, performers, or notes</div>
        ) : results.length === 0 ? (
          <div className="search-empty">No matches for "{q}"</div>
        ) : (
          results.map((r, i) => (
            <button key={i} className="search-result" onClick={() => { onGo(r.sectionId); onClose(); }}>
              <div className="where">{r.sectionTitle}{"\u00A0\u00A0\u00A0"}{r.label}</div>
              <div className="snip">{highlight(r.text.length > 180 ? r.text.slice(0, 180) + "…" : r.text)}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ---- App ----
const App = () => {
  // Tweakable defaults — JSON block for host edit-mode persistence
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "coverVariant": "default",
    "tocVariant": "default",
    "tocHighlight": "plum",
    "coverAccent": "green",
    "coverBrush": "harmony",
    "brushColor": "cream",
    "coverTextColor": "auto",
    "hiddenSections": []
  }/*EDITMODE-END*/;

  // Routing state — hash-based, falls back to "home"
  const parseHash = () => {
    const h = window.location.hash.replace(/^#\/?/, "");
    return h || "home";
  };
  const [route, setRoute] = useStateA(parseHash());

  useEffectA(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTo = useCallbackA((id) => {
    window.location.hash = "/" + id;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const goHome = useCallbackA(() => {
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Optional payload when navigating (e.g. open a specific bio)
  const [expandedBioId, setExpandedBioId] = useStateA(null);
  const goSection = useCallbackA((id, opts = {}) => {
    if (opts.expandedBioId) setExpandedBioId(opts.expandedBioId);
    window.location.hash = "/" + id;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Persistent state
  const [data, setData] = useStateA(() => {
    // 1) If exported with baked-in snapshot, use it (and ignore local cache so the
    //    hosted version starts from the published content)
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT && window.VIVO_PROGRAM_DATA_SNAPSHOT.data) {
      return JSON.parse(JSON.stringify(window.VIVO_PROGRAM_DATA_SNAPSHOT.data));
    }
    try {
      const saved = localStorage.getItem(window.__VIVO_STORAGE_KEY || "vivo-pb-data");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return JSON.parse(JSON.stringify(window.PROGRAM_DATA));
  });
  useEffectA(() => {
    try { localStorage.setItem(window.__VIVO_STORAGE_KEY || "vivo-pb-data", JSON.stringify(data)); } catch (e) {}
    // Mirror to VivoStore (Netlify Blobs when deployed) as the program record
    const slug = new URLSearchParams(location.search).get("show") || (window.PROGRAM_DATA && window.PROGRAM_DATA.slug) || "sample";
    if (window.VivoStore && !window.VIVO_PROGRAM_DATA_SNAPSHOT) {
      clearTimeout(window.__vivoSaveT);
      window.__vivoSaveT = setTimeout(async () => {
        try {
          const prev = await window.VivoStore.getProgram(slug);
          const rec = prev
            ? window.VivoStore.touch(prev, { data })
            : window.VivoStore.newRecord(slug, data, "draft");
          rec.data = data;
          await window.VivoStore.saveProgram(slug, rec);
        } catch (e) { console.warn("VivoStore save failed", e); }
      }, 800);
    }
  }, [data]);

  const [theme, setTheme] = useStateA(() => {
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT && window.VIVO_PROGRAM_DATA_SNAPSHOT.theme) {
      return window.VIVO_PROGRAM_DATA_SNAPSHOT.theme;
    }
    return localStorage.getItem("vivo-pb-theme") || "dark";
  });
  useEffectA(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vivo-pb-theme", theme);
  }, [theme]);

  const [fontSize, setFontSize] = useStateA(() => parseInt(localStorage.getItem("vivo-pb-fs") || "16", 10));
  useEffectA(() => {
    document.documentElement.style.setProperty("--app-font-size", fontSize + "px");
    localStorage.setItem("vivo-pb-fs", String(fontSize));
  }, [fontSize]);

  const [editing, setEditing] = useStateA(() => {
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT) return false; // exported HTML is read-only
    try { return localStorage.getItem("vivo-pb-editmode") === "1"; } catch (e) { return false; }
  });
  window.__editMode = editing; // keep flag in sync every render
  useEffectA(() => {
    window.__editMode = editing;
    try { localStorage.setItem("vivo-pb-editmode", editing ? "1" : "0"); } catch (e) {}
  }, [editing]);
  const toggleEditing = useCallbackA(() => {
    setEditing(e => { window.__editMode = !e; return !e; }); // set flag synchronously so editables render immediately
  }, []);

  const [menuOpen, setMenuOpen] = useStateA(false);
  const [searchOpen, setSearchOpen] = useStateA(false);
  const [importOpen, setImportOpen] = useStateA(false);
  // ?export=1 → auto-export once booted (library Export button)
  useEffectA(() => {
    if (new URLSearchParams(location.search).get("export") === "1") {
      const t = setTimeout(() => exportRef.current && exportRef.current(), 1200);
      return () => clearTimeout(t);
    }
  }, []);
  const exportRef = React.useRef(null);
  const [toast, setToast] = useStateA(null);
  useEffectA(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- Tweaks ----
  const [tweaks, setTweaks] = useStateA(() => {
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT && window.VIVO_PROGRAM_DATA_SNAPSHOT.tweaks) {
      return { ...TWEAK_DEFAULTS, ...window.VIVO_PROGRAM_DATA_SNAPSHOT.tweaks };
    }
    return TWEAK_DEFAULTS;
  });
  // Listen for tweaks panel updates
  useEffectA(() => {
    if (!window.useTweaks) return;
    // The TweaksPanel uses postMessage on parent — we read from current tweaks state. Wire up our own.
  }, []);

  // Tweaks panel: register listener for host activate/deactivate
  const [showTweaks, setShowTweaks] = useStateA(false);
  useEffectA(() => {
    const onMsg = (e) => {
      if (!e.data) return;
      if (e.data.type === "__activate_edit_mode") setShowTweaks(true);
      if (e.data.type === "__deactivate_edit_mode") setShowTweaks(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);
  const setTweak = useCallbackA((keyOrObj, val) => {
    setTweaks(t => {
      const next = typeof keyOrObj === "string" ? { ...t, [keyOrObj]: val } : { ...t, ...keyOrObj };
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: next }, "*");
      return next;
    });
  }, []);

  // Apply tweaks to cover data (without persisting into data — they're presentational)
  const cover = useMemoA(() => ({
    ...data.cover,
    accent: tweaks.coverAccent,
    brush: tweaks.coverBrush
  }), [data.cover, tweaks]);

  // ---- Section update helper ----
  const updateCover = useCallbackA((patch) => {
    setData(d => ({ ...d, cover: { ...d.cover, ...patch } }));
  }, []);
  const updateSection = useCallbackA((id, patch) => {
    setData(d => ({
      ...d,
      sections: d.sections.map(s => s.id === id ? { ...s, ...patch } : s)
    }));
  }, []);

  // Find section
  const currentSection = data.sections.find(s => s.id === route);
  const currentIdx = data.sections.findIndex(s => s.id === route);

  // Visible sections (filter out hidden via tweaks)
  const hiddenSet = useMemoA(() => new Set(tweaks.hiddenSections || []), [tweaks.hiddenSections]);
  const visibleSections = useMemoA(() => data.sections.filter(s => !hiddenSet.has(s.id)), [data.sections, hiddenSet]);
  const visibleIdx = visibleSections.findIndex(s => s.id === route);

  // ---- Share ----
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: data.cover.title, text: data.cover.subtitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast("Link copied");
      }
    } catch (e) {
      try { await navigator.clipboard.writeText(url); setToast("Link copied"); } catch (_) {}
    }
    setMenuOpen(false);
  };

  const resetData = () => {
    if (!confirm("Reset all content to the default sample?")) return;
    setData(JSON.parse(JSON.stringify(window.PROGRAM_DATA)));
    setToast("Content reset");
  };

  // ---- Export HTML for AWS hosting ----
  // Fetches the source HTML, inlines all linked CSS/JS/images/fonts, and bakes
  // current data + tweaks + theme as a snapshot so the published file boots
  // with everything as authored.
  const exportHtml = useCallbackA(async () => {
    setToast("Bundling export…");
    try {
      const snapshot = { data, tweaks, theme, fontSize, exportedAt: new Date().toISOString() };
      const json = JSON.stringify(snapshot).replace(/<\/script/gi, "<\\/script");

      // Fetch source HTML
      const sourceUrl = window.location.pathname.replace(/[?#].*$/, "");
      let html = await fetch(sourceUrl).then(r => r.text());

      // Helper: resolve relative URL against base (page URL)
      const baseUrl = new URL(sourceUrl, window.location.href);
      const resolve = (href) => new URL(href, baseUrl).href;

      // Helper: fetch as data URL
      const toDataUrl = async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error("fetch failed: " + url);
        const blob = await r.blob();
        return await new Promise((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.onerror = rej;
          fr.readAsDataURL(blob);
        });
      };

      // 1) Inline <link rel="stylesheet" href="..."> as <style>...</style>,
      //    rewriting url(...) refs inside the CSS to data URLs.
      const linkRe = /<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi;
      const links = [...html.matchAll(linkRe)];
      for (const m of links) {
        const tag = m[0];
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) continue;
        const cssUrl = resolve(hrefMatch[1]);
        try {
          let css = await fetch(cssUrl).then(r => r.text());
          // Resolve url(...) references relative to the CSS file
          const cssBase = new URL(cssUrl);
          const urlRe = /url\(\s*["']?([^"')]+)["']?\s*\)/g;
          const refs = [...new Set([...css.matchAll(urlRe)].map(x => x[1]))];
          for (const ref of refs) {
            if (ref.startsWith("data:")) continue;
            try {
              const abs = new URL(ref, cssBase).href;
              const dataUrl = await toDataUrl(abs);
              css = css.split(ref).join(dataUrl);
            } catch (_) {}
          }
          html = html.replace(tag, `<style>\n${css}\n</style>`);
        } catch (_) {}
      }

      // 2) Inline <script src="..."> tags with their fetched content.
      //    Preserve type attribute (e.g. text/babel).
      const scriptRe = /<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi;
      const scripts = [...html.matchAll(scriptRe)];
      for (const m of scripts) {
        const fullTag = m[0];
        const before = m[1] || "";
        const src = m[2];
        const after = m[3] || "";
        // Skip remote scripts (React/Babel CDN) — keep as-is so they load from CDN
        if (/^https?:\/\//i.test(src)) continue;
        try {
          const url = resolve(src);
          const code = await fetch(url).then(r => r.text());
          const escaped = code.replace(/<\/script/gi, "<\\/script");
          // Drop integrity/crossorigin attributes (irrelevant inline)
          const attrs = (before + " " + after)
            .replace(/\s+integrity=["'][^"']*["']/gi, "")
            .replace(/\s+crossorigin=["'][^"']*["']/gi, "")
            .replace(/\s+src=["'][^"']*["']/gi, "")
            .trim();
          html = html.replace(fullTag, `<script ${attrs}>\n${escaped}\n</script>`);
        } catch (_) {}
      }

      // 3) Inline <img src="..."> with data URLs
      const imgRe = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
      const imgs = [...new Set([...html.matchAll(imgRe)].map(m => m[1]))];
      for (const src of imgs) {
        if (/^(data:|https?:\/\/)/i.test(src)) continue;
        try {
          const dataUrl = await toDataUrl(resolve(src));
          html = html.split(`"${src}"`).join(`"${dataUrl}"`).split(`'${src}'`).join(`'${dataUrl}'`);
        } catch (_) {}
      }

      // 4) Inject the snapshot script at the very top of <head> so it's available
      //    before any app code runs.
      const inject = `<script>window.VIVO_PROGRAM_DATA_SNAPSHOT = ${json};</script>`;
      html = html.includes("<head>")
        ? html.replace("<head>", "<head>\n" + inject)
        : inject + html;

      // 5) Strip the editor-host postMessage chatter (won't break, just noise)
      // (left intact — harmless on a static host)

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = new URLSearchParams(location.search).get("show") || "program";
      a.download = slug + ".html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      // Mark record published
      if (window.VivoStore && !window.VIVO_PROGRAM_DATA_SNAPSHOT) {
        try {
          const prev = await window.VivoStore.getProgram(slug);
          const rec = prev ? window.VivoStore.touch(prev, {}) : window.VivoStore.newRecord(slug, data, "draft");
          rec.status = "published";
          rec.lastExportedAt = new Date().toISOString();
          await window.VivoStore.saveProgram(slug, rec);
        } catch (e) {}
      }
      setToast("Exported " + slug + ".html — upload to S3");
    } catch (e) {
      console.error(e);
      setToast("Export failed — check console");
    }
  }, [data, tweaks, theme, fontSize]);
  useEffectA(() => { exportRef.current = exportHtml; }, [exportHtml]);

  const ACCENT_MAP = {
    plum: "var(--vivo-plum)", tangerine: "var(--vivo-tangerine)", orange: "var(--vivo-orange)",
    blue: "var(--vivo-blue)", "sky-blue": "var(--vivo-sky-blue)", green: "var(--vivo-green)",
    "light-green": "var(--vivo-light-green)", lavender: "var(--vivo-lavender)", black: "var(--vivo-black)"
  };
  const accentColor = ACCENT_MAP[tweaks.tocHighlight] || "var(--vivo-plum)";
  const accentOnLight = tweaks.tocHighlight === "light-green" || tweaks.tocHighlight === "lavender";
  const accentFg = accentOnLight ? "var(--vivo-black)" : "var(--vivo-cream)";

  return (
    <div className="app" style={{ "--accent": accentColor, "--accent-fg": accentFg }}>
      <TopBar
        title={currentSection ? currentSection.title : data.cover.title}
        showLogo={!currentSection}
        logoSrc="assets/logos/vivo-logo-cream.png"
        onBack={currentSection ? goHome : null}
        onMenu={() => setMenuOpen(true)}
        onSearch={() => setSearchOpen(true)}
        home={!currentSection}
      />

      {!currentSection ? (
        <div className="page home">
          <Cover cover={cover} update={updateCover} variant="default" brushColor={tweaks.brushColor} textColor={tweaks.coverTextColor} theme={theme} />
          <NoteCallout
            label={data.cover.calloutLabel || "A note from CEO"}
            name={data.cover.calloutName || "Thor Steingraber"}
            photoSrc={data.cover.calloutPhotoSrc}
            initials={(data.cover.calloutName || "TS").split(" ").map(n => n[0]).join("").slice(0, 2)}
            onClick={() => goTo("welcome")}
            onPhotoChange={(src) => updateCover({ calloutPhotoSrc: src })}
            onPhotoClear={() => updateCover({ calloutPhotoSrc: "" })}
          />
          <TOC sections={visibleSections} onGo={goTo} variant={tweaks.tocVariant} highlightColor={tweaks.tocHighlight}
            ads={(data.sections.find(s => s.kind === "sponsors")?.ads || []).slice(0, 2).map(a => ({
              name: a.name,
              tagline: a.tagline,
              cta: "Learn more",
              href: a.url ? "https://" + a.url : "#"
            }))}
          />
          {data.cover.footerSponsor ? (
            <FooterSponsor sponsor={data.cover.footerSponsor} />
          ) : null}
          <footer className="app-footer">
            <img src={theme === "dark" ? "assets/logos/vivo-logo-cream.png" : "assets/logos/vivo-logo-black.png"} alt="Vivo" />
            <div className="footer-social">
              <a href="https://www.instagram.com/vivoperformingarts/" target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={18} /><span>Instagram</span></a>
              <a href="https://www.facebook.com/vivoperformingarts" target="_blank" rel="noopener noreferrer"><Icon name="facebook" size={18} /><span>Facebook</span></a>
              <a href="https://www.youtube.com/@vivoperformingarts" target="_blank" rel="noopener noreferrer"><Icon name="youtube" size={18} /><span>YouTube</span></a>
              <a href="https://www.linkedin.com/company/vivoperformingarts" target="_blank" rel="noopener noreferrer"><Icon name="linkedin" size={18} /><span>LinkedIn</span></a>
            </div>
            <div>© VIVO PERFORMING ARTS VIVOPERFORMINGARTS.ORG</div>
          </footer>
        </div>
      ) : (
        <div className="page section-page" key={currentSection.id}>
          <Editable as="div" className="section-eyebrow" value={currentSection.eyebrow || ""} onChange={v => updateSection(currentSection.id, { eyebrow: v })} />
          <Editable as="h1" className="section-title" value={currentSection.title} onChange={v => updateSection(currentSection.id, { title: v })} />
          <SectionBody
            section={currentSection}
            update={(patch) => updateSection(currentSection.id, patch)}
            allSections={data.sections}
            onGoSection={goSection}
            expandedBioId={expandedBioId}
            onClearExpandedBio={() => setExpandedBioId(null)}
          />
          <SectionBottomNav
            prev={visibleIdx > 0 ? visibleSections[visibleIdx - 1] : null}
            next={visibleIdx >= 0 && visibleIdx < visibleSections.length - 1 ? visibleSections[visibleIdx + 1] : null}
            onGo={goTo}
          />
        </div>
      )}

      {currentSection ? (
        <button className="toc-fab" onClick={goHome} aria-label="Back to Table of Contents">
          <Icon name="list" size={22} />
        </button>
      ) : null}

      <SettingsMenu
        open={menuOpen}        onClose={() => setMenuOpen(false)}
        theme={theme}
        onTheme={(t) => { setTheme(t); }}
        fontSize={fontSize}
        onFontSize={setFontSize}
        onShare={handleShare}
        onToggleEdit={() => { toggleEditing(); setMenuOpen(false); setToast(editing ? "Edit mode off" : "Tap any text to edit"); }}
        editing={editing}
        onImport={window.VIVO_PROGRAM_DATA_SNAPSHOT ? null : () => { setMenuOpen(false); setImportOpen(true); }}
        onExport={window.VIVO_PROGRAM_DATA_SNAPSHOT ? null : () => { setMenuOpen(false); exportHtml(); }}
        onDesign={window.VIVO_PROGRAM_DATA_SNAPSHOT ? null : () => { setMenuOpen(false); setShowTweaks(true); }}
      />
      {window.ImportOverlay ? (
        <window.ImportOverlay
          open={importOpen}
          onClose={() => setImportOpen(false)}
          hasContent={data.sections && data.sections.some(s => (s.pieces && s.pieces.length) || (s.cast && s.cast.length) || (s.bios && s.bios.length))}
          setToast={setToast}
          onApplySections={(sections, meta) => {
            setData(d => ({ ...d, sections: sections.map(s => ({ ...s, _meta: meta && meta.needsReview && meta.needsReview.includes(s.id) ? { needsReview: true } : s._meta })) }));
          }}
        />
      ) : null}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} data={data} onGo={goTo} />

      <Toast msg={toast} />

      {/* Tweaks panel */}
      {showTweaks && window.TweaksPanel ? (
        <window.TweaksPanel onClose={() => { setShowTweaks(false); window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); }}>
          <window.TweakSection label="Cover Layout">
            <window.TweakSelect
              label="Accent Color"
              value={tweaks.coverAccent}
              options={[
                { value: "plum", label: "Plum" },
                { value: "tangerine", label: "Tangerine" },
                { value: "orange", label: "Orange" },
                { value: "blue", label: "Blue" },
                { value: "sky-blue", label: "Sky Blue" },
                { value: "green", label: "Green" },
                { value: "light-green", label: "Light Green" },
                { value: "lavender", label: "Lavender" },
                { value: "black", label: "Black" }
              ]}
              onChange={v => setTweak("coverAccent", v)}
            />
            <window.TweakSelect
              label="Brush Mark"
              value={tweaks.coverBrush}
              options={["harmony", "tempo", "rhythm", "pitch", "form", "dynamics", "jazz"].map(b => ({ value: b, label: b[0].toUpperCase() + b.slice(1) }))}
              onChange={v => setTweak("coverBrush", v)}
            />
            <window.TweakRadio
              label="Brush Color"
              value={tweaks.brushColor}
              options={[
                { value: "cream", label: "Cream" },
                { value: "plum", label: "Plum" },
                { value: "black", label: "Black" }
              ]}
              onChange={v => setTweak("brushColor", v)}
            />
            <window.TweakSelect
              label="Cover Text"
              value={tweaks.coverTextColor}
              options={[
                { value: "auto", label: "Auto" },
                { value: "cream", label: "Cream" },
                { value: "black", label: "Black" },
                { value: "plum", label: "Plum" },
                { value: "tangerine", label: "Tangerine" }
              ]}
              onChange={v => setTweak("coverTextColor", v)}
            />
          </window.TweakSection>
          <window.TweakSection label="Table of Contents">
            <window.TweakRadio
              label="Layout"
              value={tweaks.tocVariant}
              options={[
                { value: "default", label: "List" },
                { value: "minimal", label: "Minimal" }
              ]}
              onChange={v => setTweak("tocVariant", v)}
            />
            <window.TweakSelect
              label="Highlight Color"
              value={tweaks.tocHighlight}
              options={[
                { value: "plum", label: "Plum" },
                { value: "tangerine", label: "Tangerine" },
                { value: "orange", label: "Orange" },
                { value: "blue", label: "Blue" },
                { value: "sky-blue", label: "Sky Blue" },
                { value: "green", label: "Green" },
                { value: "light-green", label: "Light Green" },
                { value: "lavender", label: "Lavender" },
                { value: "black", label: "Black" }
              ]}
              onChange={v => setTweak("tocHighlight", v)}
            />
          </window.TweakSection>
          <window.TweakSection label="Content">
            <window.TweakButton label="Reset Sample Content" onClick={resetData} />
          </window.TweakSection>
          <window.TweakSection label="Sections">
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Toggle off to hide a section from the table of contents and navigation. Section content is preserved.</div>
            {data.sections.map(s => (
              <window.TweakToggle
                key={s.id}
                label={s.title}
                value={!hiddenSet.has(s.id)}
                onChange={(on) => {
                  const cur = new Set(tweaks.hiddenSections || []);
                  if (on) cur.delete(s.id); else cur.add(s.id);
                  setTweak("hiddenSections", Array.from(cur));
                }}
              />
            ))}
            <window.TweakButton label="+ Add Section" onClick={() => {
              const title = (prompt("Section title?") || "").trim();
              if (!title) return;
              const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || ("section-" + Date.now());
              setData(d => {
                const exists = d.sections.some(s => s.id === slug);
                const id = exists ? slug + "-" + Date.now() : slug;
                return {
                  ...d,
                  sections: [...d.sections, {
                    id,
                    title,
                    kind: "info",
                    eyebrow: "",
                    paragraphs: [""]
                  }]
                };
              });
              setToast(`Added \"${title}\"`);
            }} />
          </window.TweakSection>
          <window.TweakSection label="Export">
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Download a self-contained HTML file with all current content baked in. Upload to AWS S3 / CloudFront and host as your official program book.</div>
            <window.TweakButton label="Download HTML" onClick={exportHtml} />
          </window.TweakSection>
        </window.TweaksPanel>
      ) : null}
    </div>
  );
};

// Mount — deferred if a per-show JSON is still loading
window.__bootProgramApp = function () {
  if (window.__bootProgramApp.done) return;
  window.__bootProgramApp.done = true;
  ReactDOM.createRoot(document.getElementById("app")).render(<App />);
};
if (!window.__PROGRAM_BOOT_DEFERRED) window.__bootProgramApp();
