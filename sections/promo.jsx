import React, { useState } from 'react';
import { Editable, PlainField, PhotoSlot, SectionBottomNav, Icon } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';
import { PROMO_BG_COLORS, VIVO_HEX, VIVO_ON_LIGHT, PROMO_BTN_COLORS } from './events.jsx';

// ---- PROMO / AD (editable ad element — row / cta / image / partner) ----
const PromoCards = ({ s, update }) => {
  const editing = useEditMode();
  const cards = s.cards && s.cards.length ? s.cards : [{ imageSrc: "", eyebrow: "", heading: "", meta: "", buttonLabel: "Learn More", buttonUrl: "", accent: "plum" }];
  const stacked = s.stack === true;
  const trackRef = React.useRef(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);
  const sync = React.useCallback(() => { const el = trackRef.current; if (!el) return; setAtStart(el.scrollLeft <= 2); setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2); }, []);
  React.useEffect(() => { sync(); }, [sync, cards.length, stacked]);
  const page = (dir) => { const el = trackRef.current; if (!el) return; const c = el.querySelector(".event-promo"); const step = c ? c.offsetWidth + 16 : el.clientWidth * 0.8; el.scrollBy({ left: dir * step, behavior: "smooth" }); };
  const patch = (i, p) => { const next = cards.map((c, j) => j === i ? { ...c, ...p } : c); update({ cards: next }); };
  const add = () => update({ cards: [...cards, { imageSrc: "", eyebrow: "", heading: "", meta: "", buttonLabel: "Learn More", buttonUrl: "", accent: "plum" }] });
  const remove = (i) => update({ cards: cards.filter((_, j) => j !== i) });
  const cardEls = cards.map((c, i) => {
    const dest = c.buttonUrl || "#";
    const ext = /^https?:/.test(dest);
    const inner = (
      <React.Fragment>
        <div className={"event-promo-img accent-" + (c.accent || "plum")}>
          {editing ? <PhotoSlot fill src={c.imageSrc || ""} initials="AD IMAGE" onChange={src => patch(i, { imageSrc: src })} onClear={() => patch(i, { imageSrc: "" })} /> : (c.imageSrc ? <img src={c.imageSrc} alt="" /> : null)}
        </div>
        <div className="event-promo-body">
          {(c.eyebrow || editing) ? <Editable as="div" className="event-promo-date" value={c.eyebrow || ""} data-placeholder="Eyebrow" onChange={v => patch(i, { eyebrow: v })} /> : null}
          <Editable as="div" className="event-promo-title" value={c.heading || ""} data-placeholder="Headline" onChange={v => patch(i, { heading: v })} />
          {(c.meta || editing) ? <Editable as="div" className="event-promo-meta" value={c.meta || ""} data-placeholder="Date · venue" onChange={v => patch(i, { meta: v })} /> : null}
          {editing ? (
            <div className="promo-card-edit" contentEditable={false}>
              <input className="sup-input promo-url" value={c.buttonUrl || ""} placeholder="https://…" onChange={e => patch(i, { buttonUrl: e.target.value })} />
              <div className="promo-swatches">{PROMO_BG_COLORS.map(col => <button key={col} className={"promo-sw" + (c.accent === col ? " is-on" : "")} style={{ background: VIVO_HEX[col] }} onClick={() => patch(i, { accent: col })} aria-label={col} />)}</div>
              <button className="promo-card-del" onClick={() => remove(i)}>Remove card</button>
            </div>
          ) : <span className="event-promo-cta">{c.buttonLabel || "Details"} &rarr;</span>}
        </div>
      </React.Fragment>
    );
    return editing
      ? <div key={i} className={"event-promo accent-" + (c.accent || "plum")}>{inner}</div>
      : <a key={i} className={"event-promo accent-" + (c.accent || "plum")} href={dest} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>;
  });
  return (
    <div className="promo-cards">
      {stacked ? (
        <div className="promo-cards-stack">{cardEls}</div>
      ) : (
        <div className="event-slider">
          <button className="event-slider-arrow prev" onClick={() => page(-1)} disabled={atStart} aria-label="Previous"><Icon name="chev-left" size={26} /></button>
          <div className="event-carousel" ref={trackRef} onScroll={sync}>{cardEls}</div>
          <button className="event-slider-arrow next" onClick={() => page(1)} disabled={atEnd} aria-label="Next"><Icon name="chev-right" size={26} /></button>
        </div>
      )}
      {editing ? <button className="promo-sponsor-add" onClick={add}>+ Add card</button> : null}
    </div>
  );
};

const PromoSection = ({ s, update }) => {
  const editing = useEditMode();
  const layout = s.layout || "row";
  // Ad blocks carry an always-on background color so they read as distinct from content
  // sections. Undefined defaults to plum; "none" opts out. Editable per block, persisted.
  const bgName = s.bgColor === undefined ? "plum" : s.bgColor;
  const hasBg = !!bgName && bgName !== "none";
  const bgHex = hasBg ? VIVO_HEX[bgName] : null;
  const bgFg = hasBg ? (VIVO_ON_LIGHT.has(bgName) ? VIVO_HEX.black : VIVO_HEX.cream) : null;
  const wrapStyle = hasBg ? { background: bgHex, color: bgFg } : undefined;
  // Card ("black box") color + text color — both fully controllable per block.
  const cardName = s.cardColor === undefined ? "black" : s.cardColor;
  const hasCard = !!cardName && cardName !== "none";
  const textName = s.textColor || (hasCard && VIVO_ON_LIGHT.has(cardName) ? "black" : "cream");
  const cardStyle = { color: VIVO_HEX[textName] };
  if (hasCard) { cardStyle.background = VIVO_HEX[cardName]; cardStyle.borderColor = "transparent"; }
  const dest = s.buttonUrl || "#";
  const btnColor = s.buttonColor || "cream";
  const btnTextName = s.buttonTextColor || (VIVO_ON_LIGHT.has(btnColor) ? "black" : "cream");
  const btnStyle = { background: VIVO_HEX[btnColor], color: VIVO_HEX[btnTextName] };
  const ext = /^https?:/.test(dest);
  const linkProps = editing ? { onClick: (e) => e.preventDefault() } : (ext ? { target: "_blank", rel: "noopener noreferrer" } : {});
  const sponsors = s.sponsors || [];
  const updateSp = (i, patch) => update({ sponsors: sponsors.map((x, j) => j === i ? { ...x, ...patch } : x) });
  const addSp = () => update({ sponsors: [...sponsors, { name: "", imageSrc: "" }] });
  const removeSp = (i) => update({ sponsors: sponsors.filter((_, j) => j !== i) });
  const Btn = (
    <a className="promo-btn" style={btnStyle} href={dest} {...linkProps}>
      <Editable as="span" value={s.buttonLabel || "Learn More"} data-placeholder="Button label" onChange={v => update({ buttonLabel: v })} />
    </a>
  );
  const controls = editing ? (
    <div className="promo-controls" contentEditable={false}>
      <div className="promo-ctl-row">
        <span className="promo-ctl-label">Layout</span>
        <div className="promo-seg">
          {[["row", "Row"], ["cta", "CTA bar"], ["side", "Image"], ["full", "Image + copy"], ["sponsors", "Sponsors"], ["cards", "Cards"]].map(([v, l]) => (
            <button key={v} aria-pressed={layout === v} onClick={() => update({ layout: v })}>{l}</button>
          ))}
        </div>
      </div>
      {layout === "cards" ? (
        <div className="promo-ctl-row">
          <span className="promo-ctl-label">Cards</span>
          <div className="promo-seg">
            <button aria-pressed={s.stack !== true} onClick={() => update({ stack: false })}>Carousel</button>
            <button aria-pressed={s.stack === true} onClick={() => update({ stack: true })}>Stack</button>
          </div>
        </div>
      ) : null}
      <div className="promo-ctl-row">
        <span className="promo-ctl-label">Button color</span>
        <div className="promo-swatches">
          {PROMO_BG_COLORS.map(c => (
            <button key={c} className={"promo-sw" + (btnColor === c ? " is-on" : "")} style={{ background: VIVO_HEX[c] }} onClick={() => update({ buttonColor: c })} aria-label={c} />
          ))}
        </div>
      </div>
      <div className="promo-ctl-row">
        <span className="promo-ctl-label">Button text</span>
        <div className="promo-seg">
          <button aria-pressed={btnTextName === "cream"} onClick={() => update({ buttonTextColor: "cream" })}>Cream</button>
          <button aria-pressed={btnTextName === "black"} onClick={() => update({ buttonTextColor: "black" })}>Black</button>
        </div>
      </div>
      <div className="promo-ctl-row">
        <span className="promo-ctl-label">Background</span>
        <div className="promo-swatches">
          <button className={"promo-sw promo-sw-none" + (!hasBg ? " is-on" : "")} onClick={() => update({ bgColor: "none" })} aria-label="No background" />
          {PROMO_BG_COLORS.map(c => (
            <button key={c} className={"promo-sw" + (bgName === c ? " is-on" : "")} style={{ background: VIVO_HEX[c] }} onClick={() => update({ bgColor: c })} aria-label={c} />
          ))}
        </div>
      </div>
      <div className="promo-ctl-row">
        <span className="promo-ctl-label">Card color</span>
        <div className="promo-swatches">
          {PROMO_BG_COLORS.map(c => (
            <button key={c} className={"promo-sw" + (cardName === c ? " is-on" : "")} style={{ background: VIVO_HEX[c] }} onClick={() => update({ cardColor: c })} aria-label={c} />
          ))}
        </div>
      </div>
      <div className="promo-ctl-row">
        <span className="promo-ctl-label">Text color</span>
        <div className="promo-seg">
          <button aria-pressed={textName === "cream"} onClick={() => update({ textColor: "cream" })}>Cream</button>
          <button aria-pressed={textName === "black"} onClick={() => update({ textColor: "black" })}>Black</button>
        </div>
      </div>
      <label className="promo-ctl-row">
        <span className="promo-ctl-label">Button link</span>
        <input className="sup-input promo-url" value={s.buttonUrl || ""} placeholder="https://…" onChange={(e) => update({ buttonUrl: e.target.value })} />
      </label>
    </div>
  ) : null;

  let card;
  if (layout === "cards") {
    card = <PromoCards s={s} update={update} />;
  } else if (layout === "cta") {
    card = (
      <div className="promo promo-cta">
        <div className="promo-cta-text">
          <Editable as="p" className="promo-cta-title" value={s.heading || ""} data-placeholder="Headline" onChange={v => update({ heading: v })} />
          {(s.body || editing) ? <Editable as="p" className="promo-cta-body" value={s.body || ""} data-placeholder="Optional subtitle" onChange={v => update({ body: v })} /> : null}
        </div>
        {Btn}
      </div>
    );
  } else if (layout === "row") {
    card = (
      <a className="promo promo-row" href={dest} {...linkProps}>
        {(s.imageSrc || editing) ? <PhotoSlot className="promo-row-thumb" src={s.imageSrc || ""} initials="IMG" size={64} onChange={src => update({ imageSrc: src })} onClear={() => update({ imageSrc: "" })} /> : null}
        <span className="promo-row-text">
          {(s.eyebrow || editing) ? <Editable as="span" className="promo-eyebrow" value={s.eyebrow || ""} data-placeholder="Eyebrow" onChange={v => update({ eyebrow: v })} /> : null}
          <Editable as="span" className="promo-row-title" value={s.heading || ""} data-placeholder="Headline" onChange={v => update({ heading: v })} />
          {(s.body || editing) ? <Editable as="span" className="promo-row-sub" value={s.body || ""} data-placeholder="Short line" onChange={v => update({ body: v })} /> : null}
        </span>
        <span className="promo-row-arrow" aria-hidden="true">→</span>
      </a>
    );
  } else if (layout === "side") {
    card = (
      <div className="promo promo-side">
        <div className="promo-side-imgwrap"><PhotoSlot fill src={s.imageSrc || ""} initials="PHOTO" onChange={src => update({ imageSrc: src })} onClear={() => update({ imageSrc: "" })} /></div>
        <div className="promo-side-body">
          {(s.eyebrow || editing) ? <Editable as="p" className="promo-eyebrow" value={s.eyebrow || ""} data-placeholder="Eyebrow" onChange={v => update({ eyebrow: v })} /> : null}
          <Editable as="p" className="promo-side-title" value={s.heading || ""} data-placeholder="Headline" onChange={v => update({ heading: v })} />
          {(s.meta || editing) ? <Editable as="p" className="promo-side-meta" value={s.meta || ""} data-placeholder="Date · venue" onChange={v => update({ meta: v })} /> : null}
          {Btn}
        </div>
      </div>
    );
  } else if (layout === "sponsors") {
    card = (
      <div className={"promo promo-sponsors" + (sponsors.length <= 1 ? " is-single" : "")}>
        <Editable as="p" className="promo-sponsors-h" value={s.heading || ""} data-placeholder="This performance is supported by" onChange={v => update({ heading: v })} />
        <div className="promo-sponsors-list">
          {sponsors.map((sp, i) => (
            <div key={i} className="promo-sponsor">
              {(sp.imageSrc || editing) ? <div className="promo-sponsor-logo"><PhotoSlot fill src={sp.imageSrc || ""} initials="LOGO" onChange={src => updateSp(i, { imageSrc: src })} onClear={() => updateSp(i, { imageSrc: "" })} /></div> : null}
              <Editable as="p" className="promo-sponsor-name" value={sp.name || ""} data-placeholder="Sponsor name" onChange={v => updateSp(i, { name: v })} />
              {editing ? <button className="promo-sponsor-del" onClick={() => removeSp(i)} aria-label="Remove sponsor">×</button> : null}
            </div>
          ))}
        </div>
        {editing ? <button className="promo-sponsor-add" onClick={addSp}>+ Add sponsor</button> : null}
      </div>
    );
  } else {
    card = (
      <div className="promo promo-full">
        <div className="promo-full-imgwrap"><PhotoSlot fill src={s.imageSrc || ""} initials="AD IMAGE" onChange={src => update({ imageSrc: src })} onClear={() => update({ imageSrc: "" })} /></div>
        <div className="promo-full-body">
          {(s.eyebrow || editing) ? <Editable as="p" className="promo-eyebrow" value={s.eyebrow || ""} data-placeholder="Eyebrow" onChange={v => update({ eyebrow: v })} /> : null}
          {(s.heading || editing) ? <Editable as="p" className="promo-full-title" value={s.heading || ""} data-placeholder="Headline" onChange={v => update({ heading: v })} /> : null}
          {(s.body || editing) ? <Editable as="p" className="promo-full-copy" value={s.body || ""} data-placeholder="Partner copy…" onChange={v => update({ body: v })} multiline /> : null}
          {Btn}
        </div>
      </div>
    );
  }
  if (layout !== "cards") {
    card = React.cloneElement(card, {
      className: (card.props.className || "") + " promo--custom",
      style: { ...(card.props.style || {}), ...cardStyle }
    });
  }
  return <div className={"promo-wrap" + (hasBg ? " has-bg" : "")} style={wrapStyle}>{controls}{card}</div>;
};

export { PromoCards, PromoSection };
