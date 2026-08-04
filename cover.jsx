import React, { useState, useEffect, useRef } from 'react';
import { Editable, PlainField, Icon, PhotoSlot } from './components.jsx';

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
          <PlainField className="cover-banner-field" label="Banner on the photo (optional)" value={cover.heroBanner || ""} placeholder="You're invited to Sound Bites — join us for a fun and relaxing gathering after the performance" onChange={v => update({ heroBanner: v })} multiline />
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

export { CoverPhotoFrame, Cover, FooterSponsor, AppFooter, NoteCallout };
