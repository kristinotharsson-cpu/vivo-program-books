import React, { useState as useStateA } from 'react';
import { Editable, PlainField, Icon, PhotoSlot } from './components.jsx';
import { useEditMode } from './edit-mode-context.jsx';
import { SectionBody } from './sections.jsx';

// ---- Standard TOC cards (present on every program) ----
const TOC_HEX = { plum: "#BD2691", cream: "#FFFBEB", black: "#000000", tangerine: "#EF4C26", orange: "#FF9E1D", blue: "#007ACC", "sky-blue": "#39BDFF", green: "#1BC469", "light-green": "#CFFFA2", lavender: "#C4B1C9" };
const TOC_ON_LIGHT = new Set(["cream", "light-green", "lavender", "sky-blue", "orange"]);
const TOC_STANDARD = {
  survey: {
    heading: "Leave Feedback",
    body: "Thank you for your feedback — it goes straight to our team.",
    buttons: [{ label: "Take the survey", url: "" }]
  },
  promos: [
    { eyebrow: "10 or more", heading: "Group Sales", meta: "Bring a crowd and save", label: "Group tickets", url: "https://www.vivoperformingarts.org/live-performances/ticket-information/group-discounts/", accent: "blue" },
    { eyebrow: "35 & under", heading: "$20 Student Tickets", meta: "Every performance, all season", label: "Student tickets", url: "https://www.vivoperformingarts.org/live-performances/ticket-information/student-tickets/", accent: "green" }
  ]
};

// Survey card — standard on every table of contents. Supports a second survey link.
const SurveyCard = ({ survey, update }) => {
  const editing = useEditMode();
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
  const editing = useEditMode();
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
  const editing = useEditMode();
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
    if (s.kind === "events" && (s.layout === "carousel" || editing)) { items.push({ kind: "events-inline", section: s }); return; }
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

export { SurveyCard, TocPromoCarousel, TOC, InlineAd };
