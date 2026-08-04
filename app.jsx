// Vivo Program Book — App shell, cover, TOC, search, routing

import React, { useState as useStateA, useEffect as useEffectA, useMemo as useMemoA, useCallback as useCallbackA } from 'react';
import { EditModeContext } from './edit-mode-context.jsx';
import { Editable, PlainField, Icon, PhotoSlot, TopBar, ReaderNav, Toast, SettingsMenu, SectionBottomNav } from './components.jsx';
import { SectionBody } from './sections.jsx';
import { ImportOverlay } from './import-overlay.jsx';
import { TweaksPanel, TweakSection, TweakSelect, TweakSlider, TweakRadio, TweakToggle, TweakButton, useTweaks } from './tweaks-panel.jsx';
import { CoverPhotoFrame, Cover, FooterSponsor, AppFooter, NoteCallout } from './cover.jsx';
import { TOC } from './toc.jsx';
import { SearchOverlay } from './search.jsx';

// ---- App ----
const App = () => {
  // Tweakable defaults — JSON block for host edit-mode persistence
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "coverVariant": "default",
    "tocVariant": "bars",
    "tocHighlight": "plum",
    "coverAccent": "green",
    "coverBrush": "harmony",
    "brushColor": "cream",
    "brushX": 0,
    "brushY": 0,
    "brushSize": 60,
    "brushRotate": 45,
    "coverTextColor": "auto",
    "programStyle": "tabular",
    "transMode": "side-by-side",
    "exportTheme": "dark",
    "showFooterSponsor": true,
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
    if (editing && window.VivoStore) { clearTimeout(window.__vivoSaveT); if (window.__commitNow) window.__commitNow(); }
    window.location.hash = "/" + id;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const goHome = useCallbackA(() => {
    if (editing && window.VivoStore) { clearTimeout(window.__vivoSaveT); if (window.__commitNow) window.__commitNow(); }
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
    // 2) The boot loader resolves the saved record (IndexedDB / Blobs) into VIVO_PROGRAM_RECORD
    //    before render — prefer it so photos and edits restore even when the localStorage
    //    mirror was dropped (base64 images exceed the ~5MB localStorage quota).
    if (window.VIVO_PROGRAM_RECORD && window.VIVO_PROGRAM_RECORD.data && window.VIVO_PROGRAM_RECORD.data.sections) {
      return JSON.parse(JSON.stringify(window.VIVO_PROGRAM_RECORD.data));
    }
    try {
      const saved = localStorage.getItem(window.__VIVO_STORAGE_KEY || "vivo-pb-data");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Version-gate the localStorage mirror too: if it predates the current base content
        // version, discard it so the program loads fresh (matches the record gate in boot).
        const base = window.PROGRAM_DATA && window.PROGRAM_DATA.contentVersion;
        if (!base || parsed.contentVersion === base) return parsed;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(window.PROGRAM_DATA));
  });
  useEffectA(() => {
    try { localStorage.setItem(window.__VIVO_STORAGE_KEY || "vivo-pb-data", JSON.stringify(data)); } catch (e) {}
    // NOTE: the authoritative commit to the program record (Netlify Blobs when deployed)
    // happens in the unified snapshot-save effect below, which also persists design tweaks,
    // theme, and text size — see "Commit the FULL editable snapshot".
  }, [data]);

  const ensureSupporters = useCallbackA(() => {
    setData(d => {
      if (!d || !d.sections) return d;
      if (d.sections.some(s => s.kind === "supporters-list")) return d;
      return { ...d, sections: [...d.sections, { id: "supporters", title: "Vivo Performing Arts Supporters", kind: "supporters-list", eyebrow: "With Gratitude" }] };
    });
  }, []);
  const [theme, setTheme] = useStateA(() => {
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT && window.VIVO_PROGRAM_DATA_SNAPSHOT.theme) {
      return window.VIVO_PROGRAM_DATA_SNAPSHOT.theme;
    }
    if (window.VIVO_PROGRAM_RECORD && window.VIVO_PROGRAM_RECORD.theme) {
      return window.VIVO_PROGRAM_RECORD.theme;
    }
    return localStorage.getItem("vivo-pb-theme") || "dark";
  });
  useEffectA(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vivo-pb-theme", theme);
  }, [theme]);

  const [fontSize, setFontSize] = useStateA(() => {
    if (window.VIVO_PROGRAM_RECORD && window.VIVO_PROGRAM_RECORD.fontSize) return window.VIVO_PROGRAM_RECORD.fontSize;
    return parseInt(localStorage.getItem("vivo-pb-fs") || "16", 10);
  });
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
  // Save-status pill + device-preview toggle (edit mode conveniences)
  const [saveState, setSaveState] = useStateA("saved"); // "saved" | "saving"
  const [lastSaved, setLastSaved] = useStateA(() => {
    const r = window.VIVO_PROGRAM_RECORD;
    return (r && r.updatedAt) ? r.updatedAt : null;
  });
  const [devicePreview, setDevicePreview] = useStateA("desktop"); // "desktop" | "mobile"
  // Undo / redo — snapshot stack of the section data (content edits)
  const historyRef = React.useRef({ stack: [], i: -1, applying: false });
  const [histState, setHistState] = useStateA({ canUndo: false, canRedo: false });
  const pushHistory = useCallbackA((snapshot) => {
    const h = historyRef.current;
    if (h.applying) return;
    h.stack = h.stack.slice(0, h.i + 1);
    h.stack.push(JSON.stringify(snapshot));
    if (h.stack.length > 50) h.stack.shift();
    h.i = h.stack.length - 1;
    setHistState({ canUndo: h.i > 0, canRedo: false });
  }, []);
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
    window.__vivoToast = (msg) => setToast(msg);
  }, []);
  useEffectA(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);
  // First-run edit tip (shown once)
  const [showTip, setShowTip] = useStateA(() => {
    try { return localStorage.getItem("vivo-pb-tip-seen") !== "1"; } catch (e) { return true; }
  });
  const dismissTip = () => { setShowTip(false); try { localStorage.setItem("vivo-pb-tip-seen", "1"); } catch (e) {} };

  // ---- Tweaks ----
  const [tweaks, setTweaks] = useStateA(() => {
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT && window.VIVO_PROGRAM_DATA_SNAPSHOT.tweaks) {
      return { ...TWEAK_DEFAULTS, ...window.VIVO_PROGRAM_DATA_SNAPSHOT.tweaks };
    }
    if (window.VIVO_PROGRAM_RECORD && window.VIVO_PROGRAM_RECORD.tweaks) {
      return { ...TWEAK_DEFAULTS, ...window.VIVO_PROGRAM_RECORD.tweaks };
    }
    try {
      const v = localStorage.getItem((window.__VIVO_STORAGE_KEY || "vivo-pb-data") + ":tweaks");
      if (v) return { ...TWEAK_DEFAULTS, ...JSON.parse(v) };
    } catch (e) {}
    return TWEAK_DEFAULTS;
  });
  // Listen for tweaks panel updates
  useEffectA(() => {
    if (!useTweaks) return;
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

  // Persist design tweaks locally (namespaced per show) so the preview restores them too.
  useEffectA(() => {
    try { localStorage.setItem((window.__VIVO_STORAGE_KEY || "vivo-pb-data") + ":tweaks", JSON.stringify(tweaks)); } catch (e) {}
  }, [tweaks]);

  // Commit the FULL editable snapshot (content + design tweaks + theme + text size) to the
  // program record (Netlify Blobs when deployed, localStorage in preview). This is what makes
  // every edit-menu change — colors, photos, layout, theme — survive a new session or device.
  const commitNow = useCallbackA(async () => {
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT || !window.VivoStore) return;
    const slug = new URLSearchParams(location.search).get("show") || (window.PROGRAM_DATA && window.PROGRAM_DATA.slug) || "sample";
    setSaveState("saving");
    try {
      const prev = await window.VivoStore.getProgram(slug);
      const rec = prev ? window.VivoStore.touch(prev, {}) : window.VivoStore.newRecord(slug, dataRef.current, "draft");
      rec.data = dataRef.current;
      rec.tweaks = tweaksRef.current;
      rec.theme = themeRef.current;
      rec.fontSize = fontSizeRef.current;
      rec.updatedAt = new Date().toISOString();
      rec.contentVersion = (window.PROGRAM_DATA && window.PROGRAM_DATA.contentVersion) || rec.contentVersion;
      await window.VivoStore.saveProgram(slug, rec);
      setLastSaved(rec.updatedAt);
    } catch (e) { console.warn("VivoStore save failed", e); }
    finally { setSaveState("saved"); }
  }, []);
  React.useEffect(() => { window.__commitNow = commitNow; }, [commitNow]);
  const dataRef = React.useRef(data); dataRef.current = data;
  const tweaksRef = React.useRef(tweaks); tweaksRef.current = tweaks;
  const themeRef = React.useRef(theme); themeRef.current = theme;
  const fontSizeRef = React.useRef(fontSize); fontSizeRef.current = fontSize;
  useEffectA(() => {
    if (window.VIVO_PROGRAM_DATA_SNAPSHOT) return; // exported HTML is read-only
    if (!window.VivoStore) return;
    clearTimeout(window.__vivoSaveT);
    window.__vivoSaveT = setTimeout(commitNow, 800);
  }, [data, tweaks, theme, fontSize]);

  // Vivo Performing Arts Supporters is standard on every book — restore it if a show is
  // missing the page or had it hidden.
  useEffectA(() => {
    ensureSupporters();
    setTweaks(t => {
      const hidden = (t.hiddenSections || []).filter(id => id !== "supporters");
      return hidden.length === (t.hiddenSections || []).length ? t : { ...t, hiddenSections: hidden };
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
  const undo = useCallbackA(() => {
    const h = historyRef.current;
    if (h.i <= 0) return;
    h.i--; h.applying = true;
    try { setData(JSON.parse(h.stack[h.i])); } finally { setTimeout(() => { h.applying = false; }, 0); }
    setHistState({ canUndo: h.i > 0, canRedo: h.i < h.stack.length - 1 });
  }, []);
  const redo = useCallbackA(() => {
    const h = historyRef.current;
    if (h.i >= h.stack.length - 1) return;
    h.i++; h.applying = true;
    try { setData(JSON.parse(h.stack[h.i])); } finally { setTimeout(() => { h.applying = false; }, 0); }
    setHistState({ canUndo: h.i > 0, canRedo: h.i < h.stack.length - 1 });
  }, []);
  // Track history + save-status as content changes
  useEffectA(() => {
    if (historyRef.current.stack.length === 0) { pushHistory(data); return; }
    pushHistory(data);
  }, [data]);
  // Keyboard undo/redo (outside rich fields, the bar handles ⌘Z inside text)
  useEffectA(() => {
    if (!editing) return;
    const onKey = (e) => {
      const inField = e.target && e.target.closest && e.target.closest(".rich-editable, [contenteditable]");
      if (inField) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing, undo, redo]);
  const MODULE_LIBRARY = [
    { kind: "info", label: "Text / Info", desc: "Headings and paragraphs", make: (t) => ({ title: t || "Information", kind: "info", eyebrow: "", paragraphs: [""] }) },
    { kind: "notes", label: "Program Notes", desc: "Long-form prose notes", make: (t) => ({ title: t || "Program Notes", kind: "notes", eyebrow: "About the Music", blocks: [{ h: "", body: [""] }] }) },
    { kind: "program", label: "Today's Program", desc: "Running order of works", make: (t) => ({ title: t || "Today's Program", kind: "program", eyebrow: "The Running Order", lead: "", pieces: [{ composer: "", work: "" }] }) },
    { kind: "cast", label: "Cast & Creative", desc: "Performers and roles", make: (t) => ({ title: t || "Cast & Creative", kind: "cast", eyebrow: "Who's Performing", cast: [{ role: "", name: "" }] }) },
    { kind: "bios", label: "About the Artist", desc: "Photo + biography", make: (t) => ({ title: t || "About the Artist", kind: "bios", eyebrow: "About the Artist", photoLayout: "thumbnail", archive: { tag: "Last with us", when: "", work: "", venue: "", body: [""] }, bios: [{ id: "bio-1", name: "", role: "", photoSrc: "", body: [""] }] }) },
    { kind: "songtexts", label: "Song Texts", desc: "Sung texts & translations", make: (t) => ({ title: t || "Sung Texts & Translations", kind: "songtexts", eyebrow: "Follow Along", lead: "", songs: [{ id: "piece-1", title: "New Piece", composer: "", note: "", origLang: "", stanzas: [{ original: ["", "", "", ""], translation: ["", "", "", ""] }] }] }) },
    { kind: "events", label: "Upcoming", desc: "Auto season calendar", make: (t) => ({ title: t || "Upcoming", kind: "events", eyebrow: "Coming Up at Vivo Performing Arts", lead: "", auto: true, count: 4 }) },
    { kind: "events", label: "Next at Vivo", desc: "Swipeable upcoming shows", make: (t) => ({ title: t || "Next at Vivo", kind: "events", eyebrow: "Coming Up at Vivo Performing Arts", lead: "", auto: true, count: 6, layout: "carousel" }) },
    { kind: "roster", label: "Roster", desc: "Grouped name lists", make: (t) => ({ title: t || "Roster", kind: "roster", eyebrow: "", groups: [{ h: "", names: [""] }] }) },
    { kind: "roster", label: "Musicians", desc: "Orchestra / ensemble roster", make: (t) => ({ title: t || "Musicians", kind: "roster", eyebrow: "The Ensemble", groups: [{ h: "Violin I", names: [""] }, { h: "Violin II", names: [""] }, { h: "Viola", names: [""] }, { h: "Cello", names: [""] }] }) },
    { kind: "supporters-list", label: "Vivo Supporters", desc: "Donor & partner listings", make: (t) => ({ title: t || "Vivo Performing Arts Supporters", kind: "supporters-list", eyebrow: "With Gratitude" }) },
    { kind: "staff-board", label: "Staff & Board", desc: "Staff, directors & advisors", make: (t) => ({ title: t || "Staff & Board", kind: "staff-board", eyebrow: "Vivo Performing Arts" }) },
    { kind: "performance-sponsor", label: "Performance Supporters", desc: "Supporter box, image optional", make: (t) => ({ title: t || "Performance Supporters", kind: "performance-sponsor", eyebrow: "Tonight's Performance", lead: "", blocks: [{ label: "Performance Sponsor", name: "Sponsor name", statement: "This performance is generously supported by Sponsor name.", imageSrc: "" }] }) },
    { kind: "promo", label: "Ad: Compact Row", desc: "Thumb + title + link", make: (t) => ({ title: t || "Promo", kind: "promo", layout: "row", eyebrow: "35 & Under", heading: "$20 Student Tickets", body: "Every show, all season", buttonLabel: "Get Tickets", buttonUrl: "https://www.vivoperformingarts.org/", buttonColor: "green", imageSrc: "" }) },
    { kind: "promo", label: "Ad: CTA Bar", desc: "One-line headline + button", make: (t) => ({ title: t || "Promo", kind: "promo", layout: "cta", heading: "Subscribe & Save 25%", buttonLabel: "Packages", buttonUrl: "https://www.vivoperformingarts.org/", buttonColor: "cream" }) },
    { kind: "promo", label: "Ad: Image + Button", desc: "Photo, title, button", make: (t) => ({ title: t || "Promo", kind: "promo", layout: "side", eyebrow: "Next at Vivo", heading: "Jeremy Denk, Piano", meta: "FRI OCT 24 · 8PM · Jordan Hall", buttonLabel: "Buy Tickets", buttonUrl: "https://www.vivoperformingarts.org/", buttonColor: "blue", imageSrc: "" }) },
    { kind: "promo", label: "Partner Ad", desc: "Image + their copy + URL", make: (t) => ({ title: t || "Partner Ad", kind: "promo", layout: "full", eyebrow: "Our Partners", heading: "Partner Name", body: "Copy supplied by the partner goes here.", buttonLabel: "Learn More", buttonUrl: "https://", buttonColor: "cream", imageSrc: "" }) },
    { kind: "promo", label: "Performance Sponsors", desc: "Recognize 1 or many sponsors", make: (t) => ({ title: t || "Performance Sponsors", kind: "promo", layout: "sponsors", heading: "This performance is generously supported by", sponsors: [{ name: "Sponsor Name", imageSrc: "" }] }) },
    { kind: "promo", label: "Ad Cards (carousel)", desc: "Multiple ad cards in a slider", make: (t) => ({ title: t || "Ad Cards", kind: "promo", layout: "cards", stack: false, cards: [{ imageSrc: "", eyebrow: "", heading: "Ad One", meta: "", buttonLabel: "Learn More", buttonUrl: "https://www.vivoperformingarts.org/", accent: "plum" }, { imageSrc: "", eyebrow: "", heading: "Ad Two", meta: "", buttonLabel: "Learn More", buttonUrl: "https://www.vivoperformingarts.org/", accent: "blue" }] }) }
  ];
  const addModule = (mod) => {
    const title = mod.make("").title || mod.label;
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || (mod.kind + "-" + Date.now());
    let newId = base;
    setData(d => {
      newId = d.sections.some(s => s.id === base) ? base + "-" + Date.now() : base;
      return { ...d, sections: [...d.sections, { id: newId, ...mod.make(title) }] };
    });
    setToast(`Added \u201c${title}\u201d — opening to edit`);
    setTimeout(() => { location.hash = "#/" + newId; }, 60);
  };

  const moveSection = useCallbackA((id, dir) => {
    setData(d => {
      const arr = [...d.sections];
      const i = arr.findIndex(s => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, sections: arr };
    });
  }, []);

  // Find section
  const currentSection = data.sections.find(s => s.id === route);
  const currentIdx = data.sections.findIndex(s => s.id === route);

  const deleteSection = useCallbackA((id) => {
    setData(d => ({ ...d, sections: d.sections.filter(s => s.id !== id) }));
  }, []);
  const duplicateSection = useCallbackA((id) => {
    setData(d => {
      const arr = [...d.sections];
      const i = arr.findIndex(s => s.id === id);
      if (i < 0) return d;
      const copy = JSON.parse(JSON.stringify(arr[i]));
      copy.id = id + "-copy-" + Date.now().toString(36);
      arr.splice(i + 1, 0, copy);
      return { ...d, sections: arr };
    });
  }, []);
  const [sectionMenuOpen, setSectionMenuOpen] = useStateA(false);
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
      const snapshot = { data, tweaks, theme: tweaks.exportTheme || theme, fontSize, exportedAt: new Date().toISOString() };
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
  const fmtLastSaved = (iso) => {
    if (!iso) return "Not saved yet";
    const d = new Date(iso), now = new Date();
    const same = d.toDateString() === now.toDateString();
    const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return "Last edited " + (same ? t : d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + t);
  };

  return (
    <EditModeContext.Provider value={editing}>
    <div className={"app" + (editing ? " is-editing-mode" : "") + (editing && showTip ? " has-tip" : "") + (editing && devicePreview === "mobile" ? " device-mobile" : "")} style={{ "--accent": accentColor, "--accent-fg": accentFg, "--brush-x": (tweaks.brushX || 0) + "%", "--brush-y": (tweaks.brushY || 0) + "%", "--brush-size": (tweaks.brushSize || 60) + "%", "--brush-scale": (tweaks.brushSize || 60) / 60, "--brush-rotate": (tweaks.brushRotate == null ? 45 : tweaks.brushRotate) + "deg" }}>
      {editing ? (
        <div className="edit-mode-bar">
          <span className="edit-mode-dot" />
          <span className="edit-mode-label">Edit Mode</span>
          <button className={"edit-save-btn" + (saveState === "saving" ? " is-saving" : "")} onClick={() => { clearTimeout(window.__vivoSaveT); commitNow(); }} disabled={saveState === "saving"}>
            <Icon name="check" size={15} />{saveState === "saving" ? "Saving…" : "Save"}
          </button>
          <span className="edit-last-saved">{fmtLastSaved(lastSaved)}</span>
          <span className="edit-tools">
            <button className="edit-tool" title="Undo (⌘Z)" disabled={!histState.canUndo} onClick={undo}><Icon name="undo" size={16} /></button>
            <button className="edit-tool" title="Redo (⌘⇧Z)" disabled={!histState.canRedo} onClick={redo}><Icon name="redo" size={16} /></button>
            <span className="edit-tool-sep" />
            <button className="edit-tool" title="Design settings — colors, layout, fonts" onClick={() => { setShowTweaks(true); setTimeout(() => window.postMessage({ type: "__activate_edit_mode" }, "*"), 50); }}><Icon name="sliders" size={16} /></button>
            <span className="edit-tool-sep" />
            <button className={"edit-tool" + (devicePreview === "desktop" ? " is-on" : "")} title="Desktop preview" onClick={() => setDevicePreview("desktop")}><Icon name="monitor" size={16} /></button>
            <button className={"edit-tool" + (devicePreview === "mobile" ? " is-on" : "")} title="Mobile preview" onClick={() => setDevicePreview("mobile")}><Icon name="phone" size={16} /></button>
          </span>
          <button className="edit-mode-done" onClick={() => { clearTimeout(window.__vivoSaveT); commitNow(); toggleEditing(); }}>Done</button>
        </div>
      ) : null}
      {editing && showTip ? (
        <div className="edit-tip">
          <span><strong>Tip:</strong> Select text to format it · Hover a section for its controls · Use <strong>+ Add</strong> or the menu to add modules · ⌘Z to undo</span>
          <button className="edit-tip-x" onClick={dismissTip} aria-label="Dismiss tip">×</button>
        </div>
      ) : null}
      {editing ? (
        <TopBar
          title={currentSection ? currentSection.title : data.cover.title}
          showLogo={!currentSection}
          logoSrc="assets/logos/vivo-logo-cream.png"
          onBack={currentSection ? goHome : null}
          onMenu={() => setMenuOpen(true)}
          onSearch={() => setSearchOpen(true)}
          home={!currentSection}
          sections={visibleSections}
          currentId={currentSection ? currentSection.id : null}
          onGo={goTo}
          onHome={goHome}
        />
      ) : (
        <ReaderNav
          sections={visibleSections}
          currentId={currentSection ? currentSection.id : null}
          currentTitle={currentSection ? currentSection.title : null}
          onGo={goTo}
          onHome={goHome}
          onBack={currentSection ? goHome : null}
          onSearch={() => setSearchOpen(true)}
          onMenu={() => setMenuOpen(true)}
          theme={theme}
        />
      )}

      {!currentSection ? (
        <div className="page home">
          <Cover cover={cover} update={updateCover} variant={tweaks.coverVariant || "default"} brushColor={tweaks.brushColor} textColor={tweaks.coverTextColor} theme={theme} />
          <NoteCallout
            label={data.cover.calloutLabel || "A note from CEO of Vivo Performing Arts"}
            name={data.cover.calloutName || "Thor Steingraber"}
            photoSrc={data.cover.calloutPhotoSrc}
            initials={(data.cover.calloutName || "TS").split(" ").map(n => n[0]).join("").slice(0, 2)}
            onClick={() => goTo("welcome")}
            onPhotoChange={(src) => updateCover({ calloutPhotoSrc: src })}
            onPhotoClear={() => updateCover({ calloutPhotoSrc: "" })}
            onLabelChange={(v) => updateCover({ calloutLabel: v })}
            onNameChange={(v) => updateCover({ calloutName: v })}
          />
          <TOC sections={visibleSections} onGo={goTo} variant={tweaks.tocVariant} highlightColor={tweaks.tocHighlight}
            photoSrc={data.cover.tocPhotoSrc} onPhoto={(src) => updateCover({ tocPhotoSrc: src })} onUpdateSection={updateSection}
            cover={data.cover} updateCover={updateCover}
            ads={(data.sections.find(s => s.kind === "sponsors")?.ads || []).slice(0, 2).map(a => ({
              name: a.name,
              tagline: a.tagline,
              cta: "Learn more",
              href: a.url ? "https://" + a.url : "#"
            }))}
          />
          {data.cover.footerSponsor && tweaks.showFooterSponsor !== false ? (
            <FooterSponsor sponsor={data.cover.footerSponsor} />
          ) : null}
          <AppFooter theme={theme} />
        </div>
      ) : (
        <div className="page section-page" key={currentSection.id} style={(() => {
          // TOC highlight color propagates to all programmatic pages via the global --accent.
          // Exception: the shared institutional pages (Supporters, Staff & Board, About Vivo)
          // don't follow the TOC highlight — they default to plum but keep their own color picker.
          const sharedKinds = { "supporters-list": 1, "staff-board": 1, "vivo": 1 };
          if (currentSection.accentColor) return { "--accent": "var(--vivo-" + currentSection.accentColor + ")" };
          if (sharedKinds[currentSection.kind]) return { "--accent": "var(--vivo-plum)" };
          return undefined;
        })()}>
          {editing ? (
            <div className="section-rail" contentEditable={false}>
              <button title="Move up" disabled={currentIdx <= 0} onClick={() => moveSection(currentSection.id, -1)}><Icon name="chev-up" size={16} /></button>
              <button title="Move down" disabled={currentIdx >= data.sections.length - 1} onClick={() => moveSection(currentSection.id, 1)}><Icon name="chev-down" size={16} /></button>
              <button title="Duplicate" onClick={() => duplicateSection(currentSection.id)}><Icon name="copy" size={15} /></button>
              <button title="Section colors" onClick={() => setSectionMenuOpen(o => !o)}><Icon name="sliders" size={16} /></button>
              <span className="section-rail-sep" />
              <button className="danger" title="Delete section" onClick={() => { deleteSection(currentSection.id); setToast("Section deleted · ⌘Z to undo"); goHome(); }}><Icon name="trash" size={15} /></button>
              {sectionMenuOpen ? (
                <div className="section-settings" onMouseDown={e => e.stopPropagation()}>
                  <div className="ss-field"><span>Accent color</span>
                    <div className="ss-swatches">
                      <button className={"ss-sw ss-sw-none" + (!currentSection.accentColor ? " is-on" : "")} title="Book default" onClick={() => updateSection(currentSection.id, { accentColor: "" })} />
                      {["plum","tangerine","orange","blue","sky-blue","green","light-green","lavender"].map(c => (
                        <button key={c} className={"ss-sw" + (currentSection.accentColor === c ? " is-on" : "")} style={{ background: "var(--vivo-" + c + ")" }} title={c} onClick={() => updateSection(currentSection.id, { accentColor: c })} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <Editable as="div" className="section-eyebrow" value={currentSection.eyebrow || ""} onChange={v => updateSection(currentSection.id, { eyebrow: v })} />
          <Editable as="h1" className="section-title" value={currentSection.title} onChange={v => updateSection(currentSection.id, { title: v })} />
          <SectionBody
            section={currentSection}
            update={(patch) => updateSection(currentSection.id, patch)}
            allSections={data.sections}
            onGoSection={goSection}
            expandedBioId={expandedBioId}
            onClearExpandedBio={() => setExpandedBioId(null)}
            displayStyle={tweaks.programStyle}
            cover={data.cover}
            updateCover={updateCover}
            defaultTransMode={tweaks.transMode}
          />
          {editing ? (
            <details className="advanced-html">
              <summary>Advanced — add custom HTML to this page</summary>
              <div className="prog-help">Optional. Anything here renders at the bottom of the page — headings, paragraphs, lists, images, links. For staff comfortable with HTML; most pages never need this.</div>
              <textarea className="prog-html-input" value={currentSection.customHtml || ""} placeholder="<p>Custom HTML for this page…</p>" onChange={(e) => updateSection(currentSection.id, { customHtml: e.target.value })} />
            </details>
          ) : (currentSection.customHtml ? <div className="prog-html" dangerouslySetInnerHTML={{ __html: currentSection.customHtml }} /> : null)}
          <SectionBottomNav
            prev={visibleIdx > 0 ? visibleSections[visibleIdx - 1] : null}
            next={visibleIdx >= 0 && visibleIdx < visibleSections.length - 1 ? visibleSections[visibleIdx + 1] : null}
            onGo={goTo}
          />
          <AppFooter theme={theme} />
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
        onDesign={window.VIVO_PROGRAM_DATA_SNAPSHOT ? null : () => { setMenuOpen(false); setShowTweaks(true); setTimeout(() => window.postMessage({ type: "__activate_edit_mode" }, "*"), 50); }}
      />
      {ImportOverlay ? (
        <ImportOverlay
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
      {showTweaks && TweaksPanel ? (
        <TweaksPanel onClose={() => { setShowTweaks(false); window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); }}>
          <TweakSection label="Cover Layout">
            <TweakSelect
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
            <TweakSelect
              label="Brush Mark"
              value={tweaks.coverBrush}
              options={["harmony", "tempo", "rhythm", "pitch", "form", "dynamics", "jazz"].map(b => ({ value: b, label: b[0].toUpperCase() + b.slice(1) }))}
              onChange={v => setTweak("coverBrush", v)}
            />
            <TweakSelect
              label="Brush Color"
              value={tweaks.brushColor}
              options={[
                { value: "cream", label: "Cream" },
                { value: "plum", label: "Plum" },
                { value: "black", label: "Black" },
                { value: "blue", label: "Blue" },
                { value: "sky-blue", label: "Sky Blue" },
                { value: "green", label: "Green" },
                { value: "light-green", label: "Light Green" },
                { value: "lavender", label: "Lavender" },
                { value: "orange", label: "Orange" },
                { value: "tangerine", label: "Tangerine" }
              ]}
              onChange={v => setTweak("brushColor", v)}
            />
            <TweakSlider label="Brush Left / Right" value={tweaks.brushX || 0} min={-40} max={40} step={1} unit="%" onChange={v => setTweak("brushX", v)} />
            <TweakSlider label="Brush Up / Down" value={tweaks.brushY || 0} min={-40} max={40} step={1} unit="%" onChange={v => setTweak("brushY", v)} />
            <TweakSlider label="Brush Size" value={tweaks.brushSize || 60} min={25} max={360} step={5} unit="%" onChange={v => setTweak("brushSize", v)} />
            <TweakSlider label="Brush Rotation" value={tweaks.brushRotate == null ? 45 : tweaks.brushRotate} min={-180} max={180} step={5} unit="°" onChange={v => setTweak("brushRotate", v)} />
            <TweakRadio
              label="Cover Text"
              value={tweaks.coverTextColor}
              options={[
                { value: "auto", label: "Auto" },
                { value: "cream", label: "Cream" },
                { value: "black", label: "Black" }
              ]}
              onChange={v => setTweak("coverTextColor", v)}
            />
          </TweakSection>
          <TweakSection label="Table of Contents">
            <TweakRadio
              label="Layout"
              value={tweaks.tocVariant}
              options={[
                { value: "bars", label: "Color Bars" },
                { value: "default", label: "List" },
                { value: "minimal", label: "Minimal" }
              ]}
              onChange={v => setTweak("tocVariant", v)}
            />
            <TweakSelect
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
          </TweakSection>
          <TweakSection label="Program">
            <TweakRadio
              label="Layout"
              value={tweaks.programStyle || "tabular"}
              options={[
                { value: "tabular", label: "Tabular" },
                { value: "centered", label: "Centered" }
              ]}
              onChange={v => setTweak("programStyle", v)}
            />
          </TweakSection>
          <TweakSection label="Song Texts">
            <TweakSelect
              label="Default Translation Mode"
              value={tweaks.transMode || "side-by-side"}
              options={[
                { value: "side-by-side", label: "Side by side" },
                { value: "stacked", label: "Stacked" },
                { value: "interlinear", label: "Interlinear" },
                { value: "facing", label: "Facing" },
                { value: "original", label: "Original only" },
                { value: "translation", label: "Translation only" }
              ]}
              onChange={v => { setTweak("transMode", v); try { localStorage.setItem("vivo-songtext-mode", v); } catch(e){} }}
            />
          </TweakSection>
          <TweakSection label="Content">
            <TweakToggle
              label="Footer Sponsor Banner"
              value={tweaks.showFooterSponsor !== false}
              onChange={on => setTweak("showFooterSponsor", on)}
            />
            <TweakButton label="Reset Sample Content" onClick={resetData} />
          </TweakSection>
          <TweakSection label="Sections">
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Toggle off to hide a section from the table of contents and navigation. Use the arrows to reorder. Section content is preserved.</div>
            {data.sections.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="text"
                  value={s.title}
                  onChange={(e) => updateSection(s.id, { title: e.target.value })}
                  style={{ flex: 1, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "#111", padding: "6px 8px", border: "1px solid #ccc", background: "#fff", minWidth: 0 }}
                />
                <button onClick={() => { const cur = new Set(tweaks.hiddenSections || []); if (hiddenSet.has(s.id)) cur.delete(s.id); else cur.add(s.id); setTweak("hiddenSections", Array.from(cur)); }} title={hiddenSet.has(s.id) ? "Show" : "Hide"} style={{ border: 0, background: "transparent", cursor: "pointer", opacity: 0.7, fontSize: 15, padding: "2px 4px" }}>{hiddenSet.has(s.id) ? "◯" : "●"}</button>
                <button onClick={() => moveSection(s.id, -1)} disabled={i === 0} title="Move up" style={{ border: 0, background: "transparent", cursor: "pointer", opacity: i === 0 ? 0.3 : 0.7, fontSize: 14, padding: "2px 4px" }}>↑</button>
                <button onClick={() => moveSection(s.id, 1)} disabled={i === data.sections.length - 1} title="Move down" style={{ border: 0, background: "transparent", cursor: "pointer", opacity: i === data.sections.length - 1 ? 0.3 : 0.7, fontSize: 14, padding: "2px 4px" }}>↓</button>
                <button onClick={() => { if (confirm('Delete "' + s.title + '"? This removes the section and its content.')) deleteSection(s.id); }} title="Delete section" style={{ border: 0, background: "transparent", cursor: "pointer", opacity: 0.75, fontSize: 16, padding: "2px 4px", color: "#ef4c26" }}>×</button>
              </div>
            ))}
            <div style={{ fontSize: 11, opacity: 0.7, margin: "4px 0 0" }}>Edit a title above to rename that page. ● shown / ◯ hidden.</div>
            <div style={{ fontSize: 12, opacity: 0.7, margin: "16px 0 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Module Library</div>
            <div className="module-lib">
              {MODULE_LIBRARY.map(mod => (
                <button key={mod.kind} className="module-lib-item" onClick={() => addModule(mod)}>
                  <span className="module-lib-label">{mod.label}</span>
                  <span className="module-lib-desc">{mod.desc}</span>
                </button>
              ))}
            </div>
          </TweakSection>
          <TweakSection label="Export">
            <TweakRadio
              label="Exported Theme"
              value={tweaks.exportTheme || "dark"}
              options={[
                { value: "dark", label: "Black" },
                { value: "light", label: "Cream" }
              ]}
              onChange={v => setTweak("exportTheme", v)}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Download a self-contained HTML file with all current content baked in. Upload to AWS S3 / CloudFront and host as your official program book.</div>
            <TweakButton label="Download HTML" onClick={exportHtml} />
          </TweakSection>
        </TweaksPanel>
      ) : null}
    </div>
    </EditModeContext.Provider>
  );
};

export { App };
