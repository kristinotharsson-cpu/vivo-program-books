// Vivo Program Book — App shell, cover, TOC, search, routing

import React, { useState as useStateA, useEffect as useEffectA, useMemo as useMemoA, useCallback as useCallbackA } from 'react';
import { Editable, PlainField, Icon, PhotoSlot, TopBar, ReaderNav, Toast, SettingsMenu, SectionBottomNav } from './components.jsx';
import { SectionBody } from './sections.jsx';
import { ImportOverlay } from './import-overlay.jsx';
import { TweaksPanel, TweakSection, TweakSelect, TweakSlider, TweakRadio, TweakToggle, TweakButton, useTweaks } from './tweaks-panel.jsx';

// ---- Cover photo frame (16:9, brush watermark when empty) ----
const CoverPhotoFrame = ({ src, alt, onChange, onClear }) => {
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
        <span className="cover-photo-hero-placeholder">
          <span className="ratio">1920 × 1080</span>
          <span className="hint">{editing ? "Click to add photo" : "Photo"}</span>
        </span>
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
    black: "var(--vivo-black)"
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
          <img className="cover-brush tr" src={brushSrc} alt="" aria-hidden="true" onError={(e) => e.target.style.display = "none"} />
          <CoverPhotoFrame
            src={cover.photoSrc}
            alt={cover.photoCaption || ""}
            onChange={(src) => update({ photoSrc: src })}
            onClear={() => update({ photoSrc: "" })}
          />
          {cover.heroBanner ? <div className="cover-photo-banner">{cover.heroBanner}</div> : null}
        </div>
        {window.__editMode ? (
          <PlainField className="cover-banner-field" label="Banner on the photo (optional)" value={cover.heroBanner || ""} placeholder="You’re invited to Sound Bites — join us for a fun and relaxing gathering after the performance" onChange={v => update({ heroBanner: v })} multiline />
        ) : null}
        <div className="cover-meta cover-meta-stack">
          {window.__editMode ? (
            <div className="pf-grid">
              <PlainField label="Date" value={cover.date} placeholder="Sunday, February 28, 2027" onChange={v => update({ date: v })} />
              <PlainField label="Time" value={cover.time} placeholder="3 PM" onChange={v => update({ time: v })} />
              <PlainField label="Venue" value={cover.venue} placeholder="Symphony Hall" onChange={v => update({ venue: v })} />
            </div>
          ) : (
            <React.Fragment>
              <div className="cover-meta-row">
                <span className="label">Date</span>
                <span className="value">{cover.date}</span>
              </div>
              <div className="cover-meta-row">
                <span className="label">Time</span>
                <span className="value">{cover.time}</span>
              </div>
              <div className="cover-meta-row">
                <span className="label">Venue</span>
                <span className="value">{cover.venue}</span>
              </div>
            </React.Fragment>
          )}
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
        {window.__editMode ? (
          <div className="pf-grid">
            <PlainField label="Date" value={cover.date} onChange={v => update({ date: v })} />
            <PlainField label="Time" value={cover.time} onChange={v => update({ time: v })} />
            <PlainField label="Venue" value={cover.venue} onChange={v => update({ venue: v })} />
          </div>
        ) : (
          <React.Fragment>
            <div>
              <span className="label">Date</span>
              <div>{cover.date}</div>
            </div>
            <div>
              <span className="label">Time</span>
              <div>{cover.time}</div>
            </div>
            <div>
              <span className="label">Venue</span>
              <div>{cover.venue}</div>
            </div>
          </React.Fragment>
        )}
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
const AppFooter = ({ theme }) => (
  <footer className="app-footer">
    <img src={theme === "dark" ? "assets/logos/vivo-logo-cream.png" : "assets/logos/vivo-logo-black.png"} alt="Vivo Performing Arts" />
    <div className="footer-social">
      <a href="https://www.instagram.com/vivoperformingarts/" target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={18} /><span>Instagram</span></a>
      <a href="https://www.facebook.com/vivoperformingarts" target="_blank" rel="noopener noreferrer"><Icon name="facebook" size={18} /><span>Facebook</span></a>
      <a href="https://www.youtube.com/@vivoperformingarts" target="_blank" rel="noopener noreferrer"><Icon name="youtube" size={18} /><span>YouTube</span></a>
      <a href="https://www.linkedin.com/company/vivoperformingarts" target="_blank" rel="noopener noreferrer"><Icon name="linkedin" size={18} /><span>LinkedIn</span></a>
    </div>
    <div className="footer-copy"><a href="https://vivoperformingarts.org" target="_blank" rel="noopener noreferrer">vivoperformingarts.org</a></div>
  </footer>
);

const NoteCallout = ({ label, name, photoSrc, initials, onClick, onPhotoChange, onPhotoClear, onLabelChange, onNameChange }) => {
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
    <button className={"note-callout" + (editing ? " is-editing" : "")} onClick={(e) => { if (editing) { if (e.target.closest(".note-callout-text")) return; return; } onClick && onClick(); }}>
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
        {editing ? (
          <React.Fragment>
            <Editable as="div" className="note-callout-label" value={label} data-ph="Callout label…" onChange={onLabelChange} />
            <Editable as="div" className="note-callout-name" value={name} data-ph="Name…" onChange={onNameChange} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="note-callout-label">{label}</div>
            <div className="note-callout-name">{name}</div>
          </React.Fragment>
        )}
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

// ---- Standard TOC cards (present on every program) ----
const TOC_HEX = { plum: "#BD2691", cream: "#FFFBEB", black: "#000000", tangerine: "#EF4C26", orange: "#FF9E1D", blue: "#007ACC", "sky-blue": "#39BDFF", green: "#1BC469", "light-green": "#CFFFA2", lavender: "#C4B1C9" };
const TOC_ON_LIGHT = new Set(["cream", "light-green", "lavender", "sky-blue", "orange"]);
const TOC_STANDARD = {
  survey: {
    heading: "Leave Feedback",
    body: "Thank you for your feedback — it goes straight to our team.",
    buttons: [{ label: "Take the survey", url: "https://www.vivoperformingarts.org/" }]
  },
  promos: [
    { eyebrow: "10 or more", heading: "Group Sales", meta: "Bring a crowd and save", label: "Group tickets", url: "https://www.vivoperformingarts.org/tickets/group-sales/", accent: "blue" },
    { eyebrow: "35 & under", heading: "$20 Student Tickets", meta: "Every performance, all season", label: "Student tickets", url: "https://www.vivoperformingarts.org/tickets/student-tickets/", accent: "green" }
  ]
};

// Survey card — standard on every table of contents. Supports a second survey link.
const SurveyCard = ({ survey, update }) => {
  const editing = window.__editMode;
  const s = survey || {};
  const heading = s.heading != null && s.heading !== "" ? s.heading : TOC_STANDARD.survey.heading;
  const body = s.body != null ? s.body : TOC_STANDARD.survey.body;
  const buttons = (s.buttons && s.buttons.length) ? s.buttons : TOC_STANDARD.survey.buttons;
  const patch = (p) => update({ ...s, heading, body, buttons, ...p });
  const setBtn = (i, p) => patch({ buttons: buttons.map((b, j) => j === i ? { ...b, ...p } : b) });
  if (editing) {
    return (
      <div className="toc-survey is-editing">
        <div className="pf-grid">
          <PlainField label="Survey card heading" value={heading} onChange={v => patch({ heading: v })} />
          <PlainField label="Thank-you line" value={body} onChange={v => patch({ body: v })} />
          {buttons.map((b, i) => (
            <React.Fragment key={i}>
              <PlainField label={"Button " + (i + 1) + " label"} value={b.label || ""} placeholder="Take the survey" onChange={v => setBtn(i, { label: v })} />
              <PlainField label={"Button " + (i + 1) + " link"} value={b.url || ""} placeholder="https://…" onChange={v => setBtn(i, { url: v })} />
            </React.Fragment>
          ))}
        </div>
        <div className="prog-edit prog-edit-add">
          {buttons.length < 2 ? <button onClick={() => patch({ buttons: [...buttons, { label: "Second survey", url: "https://" }] })}>+ Second survey link</button> : null}
          {buttons.length > 1 ? <button onClick={() => patch({ buttons: buttons.slice(0, -1) })}>Remove second link</button> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="toc-survey">
      <div className="toc-survey-text">
        <div className="toc-survey-h">{heading}</div>
        {body ? <div className="toc-survey-body">{body}</div> : null}
      </div>
      <div className="toc-survey-btns">
        {buttons.filter(b => b.label).map((b, i) => (
          <a key={i} className="toc-survey-btn" href={b.url || "#"} target="_blank" rel="noopener noreferrer">{b.label}<span aria-hidden="true">→</span></a>
        ))}
      </div>
    </div>
  );
};

// Group sales + student tickets — a small carousel, standard on every table of contents.
const TocPromoCarousel = ({ promos, update }) => {
  const editing = window.__editMode;
  const cards = (promos && promos.length) ? promos : TOC_STANDARD.promos;
  const trackRef = React.useRef(null);
  const page = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const c = el.querySelector(".toc-promo-card");
    el.scrollBy({ left: dir * ((c ? c.offsetWidth : el.clientWidth * 0.8) + 12), behavior: "smooth" });
  };
  const setCard = (i, p) => update(cards.map((c, j) => j === i ? { ...c, ...p } : c));
  if (editing) {
    return (
      <div className="toc-promo-edit">
        <div className="toc-promo-edit-h">Standard cards — group sales & student tickets</div>
        {cards.map((c, i) => (
          <div key={i} className="pf-grid">
            <PlainField label="Heading" value={c.heading || ""} onChange={v => setCard(i, { heading: v })} />
            <PlainField label="Short line" value={c.meta || ""} onChange={v => setCard(i, { meta: v })} />
            <PlainField className="pf-wide" label="Link" value={c.url || ""} placeholder="https://www.vivoperformingarts.org/…" onChange={v => setCard(i, { url: v })} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="toc-promo-carousel">
      <button className="event-slider-arrow prev" onClick={() => page(-1)} aria-label="Previous"><Icon name="chev-left" size={24} /></button>
      <div className="toc-promo-track" ref={trackRef}>
        {cards.map((c, i) => {
          const bg = TOC_HEX[c.accent || "plum"];
          const fg = TOC_ON_LIGHT.has(c.accent || "plum") ? TOC_HEX.black : TOC_HEX.cream;
          return (
            <a key={i} className="toc-promo-card" style={{ background: bg, color: fg }} href={c.url || "#"} target="_blank" rel="noopener noreferrer">
              {c.eyebrow ? <span className="toc-promo-eyebrow">{c.eyebrow}</span> : null}
              <span className="toc-promo-h">{c.heading}</span>
              {c.meta ? <span className="toc-promo-meta">{c.meta}</span> : null}
              <span className="toc-promo-cta">{c.label || "Learn more"} <span aria-hidden="true">→</span></span>
            </a>
          );
        })}
      </div>
      <button className="event-slider-arrow next" onClick={() => page(1)} aria-label="Next"><Icon name="chev-right" size={24} /></button>
    </div>
  );
};

// ---- TOC ----
const TOC_BAR_PALETTE = [
  ["var(--vivo-plum)", "var(--vivo-cream)"],
  ["var(--vivo-orange)", "var(--vivo-black)"],
  ["var(--vivo-green)", "var(--vivo-black)"],
  ["var(--vivo-blue)", "var(--vivo-cream)"]
];
const TOC = ({ sections, onGo, variant, ads = [], highlightColor, photoSrc, onPhoto, onUpdateSection, cover = {}, updateCover }) => {
  const editing = window.__editMode;
  const [photoOpen, setPhotoOpen] = useStateA(false);
  const isBars = !variant || variant === "bars";
  const cls = "toc-list" + (variant === "minimal" ? " is-minimal" : isBars ? " is-bars" : "");
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
  const tocStyle = { "--toc-highlight": highlight, "--toc-highlight-fg": highlightFg, "--bar": highlight, "--bar-fg": highlightFg };
  // Inline ads slotted into TOC at intervals
  const EVT_HEX = { plum: "#BD2691", cream: "#FFFBEB", black: "#000000", tangerine: "#EF4C26", orange: "#FF9E1D", blue: "#007ACC", "sky-blue": "#39BDFF", green: "#1BC469", "light-green": "#CFFFA2", lavender: "#C4B1C9" };
  const EVT_ON_LIGHT = new Set(["cream", "light-green", "lavender", "sky-blue", "orange"]);
  const items = [];
  sections.forEach((s, i) => {
    if (s.kind === "promo") { items.push({ kind: "promo", section: s }); return; }
    if (s.kind === "events" && (s.layout === "carousel" || window.__editMode)) { items.push({ kind: "events-inline", section: s }); return; }
    items.push({ kind: "section", section: s, idx: i });
    // After items 3 and 7, slot an ad if available
    if ((i === 2 || i === 6) && ads[Math.floor(i / 4)]) {
      items.push({ kind: "ad", ad: ads[Math.floor(i / 4)] });
    }
  });
  if (isBars && (photoSrc || editing)) {
    items.splice(Math.min(3, items.length), 0, { kind: "photo" });
  }
  items.push({ kind: "tickets" });
  items.push({ kind: "survey" });
  return (
    <section className="toc-section" style={tocStyle}>
      <ol className={cls} style={{ marginTop: 0 }}>
        {items.map((item, i) => item.kind === "ad" ? (
          <li key={"ad-" + i} className="toc-ad-slot">
            <InlineAd ad={item.ad} />
          </li>
        ) : item.kind === "photo" ? (
          <li key="toc-photo" className={"toc-photo" + (!photoSrc && !photoOpen ? " is-empty" : "")}>
            {photoSrc || photoOpen ? (
              <PhotoSlot fill src={photoSrc || ""} alt="" initials="DROP A PHOTO" onChange={onPhoto} onClear={() => { if (onPhoto) onPhoto(""); setPhotoOpen(false); }} />
            ) : (
              <button className="toc-photo-add" onClick={() => setPhotoOpen(true)}>
                <Icon name="image" size={16} /><span>Add a photo here</span>
              </button>
            )}
          </li>
        ) : item.kind === "tickets" ? (
          <li key="toc-tickets" className="toc-standard-item">
            <TocPromoCarousel promos={cover.tocPromos} update={(promos) => updateCover && updateCover({ tocPromos: promos })} />
          </li>
        ) : item.kind === "survey" ? (
          <li key="toc-survey" className="toc-standard-item">
            <SurveyCard survey={cover.survey} update={(survey) => updateCover && updateCover({ survey })} />
          </li>
        ) : item.kind === "promo" ? (
          <li key={item.section.id} className="toc-promo-item">
            {React.createElement(SectionBody, { section: item.section, update: (patch) => onUpdateSection && onUpdateSection(item.section.id, patch) })}
          </li>
        ) : item.kind === "events-inline" ? (
          (() => {
            const bc = item.section.bgColor;
            const hasBc = bc && bc !== "none";
            const evStyle = hasBc ? { background: EVT_HEX[bc], color: EVT_ON_LIGHT.has(bc) ? "#000" : "#FFFBEB" } : undefined;
            return (
              <li key={item.section.id} className={"toc-events-item" + (hasBc ? " has-bg" : "")} style={evStyle}>
                <div className="toc-events-head">
                  {item.section.eyebrow ? <p className="toc-events-eyebrow">{item.section.eyebrow}</p> : null}
                  <h2 className="toc-events-title">{item.section.title}</h2>
                </div>
                {React.createElement(SectionBody, { section: item.section, update: (patch) => onUpdateSection && onUpdateSection(item.section.id, patch) })}
              </li>
            );
          })()
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
    // Search intentionally excludes section title + eyebrow — only body content is indexed.
    if (sec.lead) collect(sec.lead, "Intro");
    if (sec.quote) collect(sec.quote, "Quote");
    if (Array.isArray(sec.body)) sec.body.forEach(t => collect(t, "Welcome"));
    else if (typeof sec.body === "string") collect(sec.body, "Welcome");
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
    if (window.__editMode && window.VivoStore) { clearTimeout(window.__vivoSaveT); if (window.__commitNow) window.__commitNow(); }
    window.location.hash = "/" + id;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const goHome = useCallbackA(() => {
    if (window.__editMode && window.VivoStore) { clearTimeout(window.__vivoSaveT); if (window.__commitNow) window.__commitNow(); }
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
  );
};

export { App };
