import React, { useState } from 'react';
import { Editable, PlainField, PhotoSlot } from '../components.jsx';

// ---- PERFORMANCE SPONSOR ----
const PerformanceSponsorSection = ({ s, update }) => {
  const blocks = s.blocks || [];
  const updateBlock = (i, patch) => {
    const next = blocks.map((b, j) => j === i ? { ...b, ...patch } : b);
    update({ blocks: next });
  };
  const addBlock = () => {
    update({ blocks: [...blocks, { label: "Additional support", name: "Donor name", statement: "Additional support for this performance is provided by Donor name." }] });
  };
  const addImageBlock = () => {
    update({ blocks: [...blocks, { label: "Performance Sponsor", name: "Sponsor name", statement: "This performance is generously supported by Sponsor name.", imageSrc: "" }] });
  };
  const removeBlock = (i) => {
    update({ blocks: blocks.filter((_, j) => j !== i) });
  };
  return (
    <div className="perf-sponsor">
      {(s.imageSrc || window.__editMode) ? (
        <div className="perf-sponsor-image">
          <PhotoSlot
            fill
            src={s.imageSrc || ""}
            alt="Performance sponsor"
            initials="SPONSOR IMAGE"
            onChange={(src) => update({ imageSrc: src })}
            onClear={() => update({ imageSrc: "" })}
          />
        </div>
      ) : null}
      <Editable as="p" className="lead" value={s.lead || ""} onChange={v => update({ lead: v })} multiline />
      <div className="perf-sponsor-blocks">
        {blocks.map((b, i) => {
          const isCard = b.imageSrc !== undefined;
          return (
          <div key={i} className={"perf-sponsor-block" + (isCard ? " perf-sponsor-card" : "")}>
            {isCard ? (
              <div className="perf-sponsor-card-img">
                <PhotoSlot fill src={b.imageSrc || ""} alt={b.name || "Sponsor"} initials="SPONSOR IMAGE"
                  onChange={(src) => updateBlock(i, { imageSrc: src })} onClear={() => updateBlock(i, { imageSrc: "" })} />
              </div>
            ) : null}
            <div className="perf-sponsor-card-body">
              <Editable as="div" className="perf-sponsor-label" value={b.label} onChange={v => updateBlock(i, { label: v })} />
              <Editable as="div" className="perf-sponsor-name" value={b.name} onChange={v => updateBlock(i, { name: v })} />
              {b.statement !== undefined ? (
                <Editable as="p" className="perf-sponsor-statement" value={b.statement} onChange={v => updateBlock(i, { statement: v })} multiline />
              ) : null}
              {window.__editMode ? (
                <button className="perf-sponsor-remove" onClick={() => removeBlock(i)} aria-label="Remove sponsor block">Remove</button>
              ) : null}
            </div>
          </div>
          );
        })}
        {window.__editMode ? (
          <div className="perf-sponsor-add-row">
            <button className="perf-sponsor-add" onClick={addBlock}>+ Add sponsor block</button>
            <button className="perf-sponsor-add" onClick={addImageBlock}>+ Add sponsor with image</button>
          </div>
        ) : null}
      </div>
      {s.seasonSponsors ? (
        <div className="perf-sponsor-season">
          <Editable as="div" className="perf-sponsor-label" value={s.seasonSponsorsLabel || "Season Sponsors"} onChange={v => update({ seasonSponsorsLabel: v })} />
          <Editable as="div" className="perf-sponsor-name" value={s.seasonSponsors} onChange={v => update({ seasonSponsors: v })} multiline />
        </div>
      ) : null}
      {s.mgmtCredit ? (
        <Editable as="p" className="perf-sponsor-mgmt" value={s.mgmtCredit} onChange={v => update({ mgmtCredit: v })} multiline />
      ) : null}
      {s.publicSupport ? (
        <Editable as="p" className="perf-sponsor-public" value={s.publicSupport} onChange={v => update({ publicSupport: v })} multiline />
      ) : null}
      {s.closing ? (
        <Editable as="p" className="perf-sponsor-closing" value={s.closing} onChange={v => update({ closing: v })} multiline />
      ) : null}
    </div>
  );
};

// ---- SPONSORS / ADS ----
const SponsorsSection = ({ s, update }) => (
  <div>
    {s.ads.map((ad, i) => (
      <div key={i} className="ad-card" style={{ marginBottom: 16 }}>
        <Editable as="div" className="eyebrow" value={ad.eyebrow} onChange={v => {
          const ads = [...s.ads]; ads[i] = { ...ad, eyebrow: v }; update({ ads });
        }} />
        <Editable as="div" className="name" value={ad.name} onChange={v => {
          const ads = [...s.ads]; ads[i] = { ...ad, name: v }; update({ ads });
        }} />
        <Editable as="div" className="tagline" value={ad.tagline} onChange={v => {
          const ads = [...s.ads]; ads[i] = { ...ad, tagline: v }; update({ ads });
        }} />
        <Editable as="div" className="url" value={ad.url} onChange={v => {
          const ads = [...s.ads]; ads[i] = { ...ad, url: v }; update({ ads });
        }} />
      </div>
    ))}
  </div>
);

export { PerformanceSponsorSection, SponsorsSection };
