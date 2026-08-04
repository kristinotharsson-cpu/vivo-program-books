import React, { useState, useEffect } from 'react';
import { Icon, PhotoSlot, Editable } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';

// ---- SHARED COLOR CONSTANTS (used here and by promo.jsx / archive.jsx) ----
const PROMO_BG_COLORS = ["plum", "tangerine", "orange", "blue", "sky-blue", "green", "light-green", "lavender", "cream", "black"];
const VIVO_HEX = { plum: "#BD2691", cream: "#FFFBEB", black: "#000000", tangerine: "#EF4C26", orange: "#FF9E1D", blue: "#007ACC", "sky-blue": "#39BDFF", green: "#1BC469", "light-green": "#CFFFA2", lavender: "#C4B1C9" };
const VIVO_ON_LIGHT = new Set(["cream", "light-green", "lavender", "sky-blue", "orange"]);
const PROMO_BTN_COLORS = ["cream", "light-green", "lavender", "plum", "blue", "orange"];

// ---- EVENTS (upcoming) ----
// Slide carousel of performance cards (like the website's Related Events slider):
// prev/next arrows page through the track; scroll-snaps on touch.
const EventCarousel = ({ events, linkTo, editing, onColor, onThumb }) => {
  const trackRef = React.useRef(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);
  const sync = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);
  React.useEffect(() => { sync(); }, [sync, events.length]);
  const page = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(".event-promo");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  return (
    <div className="event-slider">
      <button className="event-slider-arrow prev" onClick={() => page(-1)} disabled={atStart} aria-label="Previous"><Icon name="chev-left" size={26} /></button>
      <div className="event-carousel" ref={trackRef} onScroll={sync}>
        {events.map((e, i) => {
          const dest = linkTo === "program" ? (e.programUrl || e.href || e.url) : (e.websiteUrl || e.href || e.url);
          const ext = /^https?:/.test(dest || "");
          return (
            <a key={i} className={"event-promo accent-" + (e.accent || "plum")} href={editing ? undefined : dest} onClick={editing ? (ev => ev.preventDefault()) : undefined} {...(!editing && ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <div className={"event-promo-img accent-" + (e.accent || "plum")}>{editing ? <PhotoSlot fill src={e.thumb || ""} initials="ADD PHOTO" onChange={src => onThumb && onThumb(e, src)} onClear={() => onThumb && onThumb(e, "")} /> : (e.thumb ? <img src={e.thumb} alt="" /> : null)}</div>
              <div className="event-promo-body">
                <div className="event-promo-date">{e.month}&nbsp;{e.day}</div>
                <div className="event-promo-title">{e.title}</div>
                {e.meta ? <div className="event-promo-meta">{e.meta}</div> : null}
                {editing ? (
                  <div className="promo-card-edit" contentEditable={false}>
                    <span className="promo-ctl-label">Card color</span>
                    <div className="promo-swatches">{PROMO_BG_COLORS.map(col => <button key={col} className={"promo-sw" + ((e.accent || "plum") === col ? " is-on" : "")} style={{ background: VIVO_HEX[col] }} onClick={() => onColor && onColor(e, col)} aria-label={col} />)}</div>
                  </div>
                ) : <span className="event-promo-cta">Details &rarr;</span>}
              </div>
            </a>
          );
        })}
      </div>
      <button className="event-slider-arrow next" onClick={() => page(1)} disabled={atEnd} aria-label="Next"><Icon name="chev-right" size={26} /></button>
    </div>
  );
};

// ---- EVENTS (upcoming) ----
// Auto-populates from shows/manifest.json (the next few shows after this one),
// each card linking to that show's program. Set s.auto = false to hand-curate.
const EventsSection = ({ s, update }) => {
  const editing = useEditMode();
  const [auto, setAuto] = React.useState([]);
  const isAuto = s.auto !== false;
  React.useEffect(() => {
    if (!isAuto) return;
    const hidden = s.hiddenSlugs || [];
    const params = new URLSearchParams(location.search);
    const slug = params.get("show");
    fetch("shows/manifest.json").then(r => r.json()).then(list => {
      const sorted = [...list].filter(m => m.iso).sort((a, b) => a.iso.localeCompare(b.iso));
      const self = sorted.find(m => m.slug === slug);
      const after = self ? sorted.filter(m => m.iso > self.iso) : sorted;
      const take = (after.length ? after : sorted).filter(m => !hidden.includes(m.slug)).slice(0, s.count || 4);
      setAuto(take.map(m => {
        const d = new Date(m.iso + "T00:00");
        return {
          month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
          day: String(d.getUTCDate()),
          title: m.title,
          meta: [m.leadArtist !== m.title ? m.leadArtist : null, m.venue].filter(Boolean).join("   "),
          href: m.pdpUrl || m.eventUrl || ("Program Book.html?show=" + m.slug),
          websiteUrl: m.pdpUrl || m.eventUrl || ("https://www.vivoperformingarts.org/live-performances/performance-event-calendar/"),
          programUrl: "Program Book.html?show=" + m.slug,
          slug: m.slug,
          thumb: (s.thumbs && s.thumbs[m.slug]) || m.thumb || "",
          accent: m.accent || "plum"
        };
      }));
    }).catch(() => {});
  }, [isAuto, s.count, s.thumbs, s.hiddenSlugs]);

  const cardColors = s.cardColors || {};
  const extras = (s.extra || []).map((e, ei) => ({ ...e, manual: true, _ei: ei, accent: e.accent || "plum", websiteUrl: e.url || "#", programUrl: e.url || "#", href: e.url || "#" }));
  const events = (isAuto ? [...auto, ...extras] : (s.events || [])).map(e => e.slug && cardColors[e.slug] ? { ...e, accent: cardColors[e.slug] } : e);
  const setCardColor = (e, color) => {
    if (e.manual) { const extra = [...(s.extra || [])]; extra[e._ei] = { ...extra[e._ei], accent: color }; update({ extra }); }
    else if (e.slug) { update({ cardColors: { ...cardColors, [e.slug]: color } }); }
    else { const events2 = [...(s.events || [])]; const idx = events2.indexOf(e); if (idx >= 0) { events2[idx] = { ...e, accent: color }; update({ events: events2 }); } }
  };
  const setCardThumb = (e, src) => {
    if (e.manual) { const extra = [...(s.extra || [])]; extra[e._ei] = { ...extra[e._ei], thumb: src }; update({ extra }); }
    else if (e.slug) { update({ thumbs: { ...(s.thumbs || {}), [e.slug]: src } }); }
    else { const events2 = [...(s.events || [])]; const idx = events2.indexOf(e); if (idx >= 0) { events2[idx] = { ...e, thumb: src }; update({ events: events2 }); } }
  };
  const linkTo = s.linkTo || "website";
  const isCarousel = s.layout ? s.layout === "carousel" : isAuto;
  const hideSlug = (slug) => update({ hiddenSlugs: [...(s.hiddenSlugs || []), slug] });
  const patchExtra = (idx, patch) => { const extra = [...(s.extra || [])]; extra[idx] = { ...extra[idx], ...patch }; update({ extra }); };
  const removeExtra = (idx) => { const extra = [...(s.extra || [])]; extra.splice(idx, 1); update({ extra }); };
  return (
    <div>
      {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
      {isAuto && editing ? (
        <div className="st-song-modes" role="group" aria-label="Link destination">
          <span className="st-song-modes-hint">Cards link to:</span>
          <button aria-pressed={linkTo === "website"} onClick={() => update({ linkTo: "website" })}>Vivo Performing Arts website</button>
          <button aria-pressed={linkTo === "program"} onClick={() => update({ linkTo: "program" })}>Program page</button>
        </div>
      ) : null}
      {editing ? (
        <div className="st-song-modes" role="group" aria-label="Layout">
          <span className="st-song-modes-hint">Layout:</span>
          <button aria-pressed={!isCarousel} onClick={() => update({ layout: "list" })}>List</button>
          <button aria-pressed={isCarousel} onClick={() => update({ layout: "carousel" })}>Carousel</button>
        </div>
      ) : null}
      {editing && isCarousel ? (
        <div className="st-song-modes" role="group" aria-label="Background color">
          <span className="st-song-modes-hint">Background:</span>
          <div className="promo-swatches">
            <button className={"promo-sw promo-sw-none" + (!s.bgColor || s.bgColor === "none" ? " is-on" : "")} onClick={() => update({ bgColor: "none" })} aria-label="No background" />
            {PROMO_BG_COLORS.map(c => (
              <button key={c} className={"promo-sw" + (s.bgColor === c ? " is-on" : "")} style={{ background: VIVO_HEX[c] }} onClick={() => update({ bgColor: c })} aria-label={c} />
            ))}
          </div>
        </div>
      ) : null}
      {isCarousel ? (
        <EventCarousel events={events} linkTo={linkTo} editing={editing} onColor={setCardColor} onThumb={setCardThumb} />
      ) : (
      <ul className="event-list">
        {events.map((e, i) => {
          const inner = (
            <React.Fragment>
              <div className="event-date">
                <span className="month">{e.month}</span>
                <span className="day">{e.day}</span>
              </div>
              {isAuto ? (
                <div className={"event-thumb accent-" + (e.accent || "plum")}>
                  {e.thumb ? <img src={e.thumb} alt="" /> : null}
                </div>
              ) : null}
              <div className="event-info">
                <div className="title">{e.title}</div>
                <div className="meta">{e.meta}</div>
              </div>
              {e.href ? <Icon name="arrow-right" size={18} /> : null}
            </React.Fragment>
          );
          if (isAuto) {
            const dest = linkTo === "program" ? e.programUrl : e.websiteUrl;
            const ext = /^https?:/.test(dest);
            const setThumb = (src) => update({ thumbs: { ...(s.thumbs || {}), [e.slug]: src } });
            if (editing) {
              const xIdx = e.manual ? (s.extra || []).indexOf((s.extra || [])[e._ei]) : -1;
              return (
                <li key={i} className="event-card event-card-edit">
                  <div className="event-date">
                    {e.manual
                      ? <><Editable as="span" className="month" value={e.month} onChange={v => patchExtra(e._ei, { month: v })} /><Editable as="span" className="day" value={e.day} onChange={v => patchExtra(e._ei, { day: v })} /></>
                      : <><span className="month">{e.month}</span><span className="day">{e.day}</span></>}
                  </div>
                  <PhotoSlot className={"event-thumb accent-" + (e.accent || "plum")} src={e.thumb} alt={e.title} onChange={e.manual ? (src => patchExtra(e._ei, { thumb: src })) : setThumb} onClear={() => e.manual ? patchExtra(e._ei, { thumb: "" }) : setThumb("")} size={60} />
                  <div className="event-info">
                    {e.manual
                      ? <><Editable as="div" className="title" value={e.title} onChange={v => patchExtra(e._ei, { title: v })} /><Editable as="div" className="meta" value={e.meta} onChange={v => patchExtra(e._ei, { meta: v })} multiline /><Editable as="div" className="meta" value={e.url || ""} onChange={v => patchExtra(e._ei, { url: v })} /></>
                      : <><div className="title">{e.title}</div><div className="meta">{e.meta}</div></>}
                  </div>
                  <button className="event-remove" title="Remove from list" onClick={() => e.manual ? removeExtra(e._ei) : hideSlug(e.slug)}>✕</button>
                </li>
              );
            }
            return <li key={i} className="event-card event-card-link"><a className="event-link" href={dest} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a></li>;
          }
          return (
            <li key={i} className="event-card">
              <div className="event-date">
                <Editable as="span" className="month" value={e.month} onChange={v => { const events = [...s.events]; events[i] = { ...e, month: v }; update({ events }); }} />
                <Editable as="span" className="day" value={e.day} onChange={v => { const events = [...s.events]; events[i] = { ...e, day: v }; update({ events }); }} />
              </div>
              <div className="event-info">
                <Editable as="div" className="title" value={e.title} onChange={v => { const events = [...s.events]; events[i] = { ...e, title: v }; update({ events }); }} />
                <Editable as="div" className="meta" value={e.meta} onChange={v => { const events = [...s.events]; events[i] = { ...e, meta: v }; update({ events }); }} multiline />
              </div>
            </li>
          );
        })}
      </ul>
      )}
      {isAuto && editing ? (
        <div className="prog-edit prog-edit-add">
          <button onClick={() => update({ extra: [...(s.extra || []), { month: "MON", day: "1", title: "New Listing", meta: "Details", url: "https://www.vivoperformingarts.org/" }] })}>+ Add listing</button>
          {(s.hiddenSlugs && s.hiddenSlugs.length) ? <button onClick={() => update({ hiddenSlugs: [] })}>Restore removed ({s.hiddenSlugs.length})</button> : null}
        </div>
      ) : null}
    </div>
  );
};

export { EventsSection, PROMO_BG_COLORS, VIVO_HEX, VIVO_ON_LIGHT, PROMO_BTN_COLORS };
