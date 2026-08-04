import React, { useState } from 'react';
import { Editable } from '../components.jsx';
import { PROMO_BG_COLORS, VIVO_HEX, VIVO_ON_LIGHT } from './events.jsx';
import { useEditMode } from '../edit-mode-context.jsx';

// ---- FROM THE ARCHIVES (box above the artist bio, default-on) ----
const ArchiveBox = ({ s, update }) => {
  const editing = useEditMode();
  const [open, setOpen] = React.useState(false);
  const a = s.archive || {};
  const tag = a.tag != null ? a.tag : "Last with us";
  const hasContent = !!(a.when || a.work || a.venue || (a.body || []).some(x => x && x.trim()));
  // Default-on: always shown while editing; in the reader/export it appears only once filled.
  if (!editing && !hasContent) return null;
  const patch = (p) => update({ archive: { ...a, ...p } });
  const body = a.body && a.body.length ? a.body : [""];
  const accentName = a.color || "plum";
  const accent = VIVO_HEX[accentName];
  const onLight = VIVO_ON_LIGHT.has(accentName);
  const headStyle = { background: accent, color: onLight ? VIVO_HEX.black : VIVO_HEX.cream };
  return (
    <aside className={"archive-box is-compact" + (open ? " is-open" : "")}>
      <button className="archive-box-head" style={headStyle} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="archive-box-when">From the Archives</span>
        <span className="archive-box-chev" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open ? (
      <div className="archive-box-body">
        {body.map((p, i) => (
          <Editable key={i} as="p" className="archive-box-note" value={p} data-placeholder="Write about this artist's history with us…" onChange={v => { const next = [...body]; next[i] = v; patch({ body: next }); }} multiline />
        ))}
        {editing ? (
          <div className="archive-box-ctl" contentEditable={false}>
            <button className="archive-box-addp" onClick={() => patch({ body: [...body, ""] })}>+ Paragraph</button>
            {body.length > 1 ? <button className="archive-box-addp" onClick={() => patch({ body: body.slice(0, -1) })}>− Paragraph</button> : null}
            <span className="archive-box-ctl-label">Header color</span>
            <div className="promo-swatches">
              <button className={"promo-sw promo-sw-none" + (!a.color ? " is-on" : "")} onClick={() => patch({ color: "" })} aria-label="Book default" />
              {PROMO_BG_COLORS.map(c => (
                <button key={c} className={"promo-sw" + (a.color === c ? " is-on" : "")} style={{ background: VIVO_HEX[c] }} onClick={() => patch({ color: c })} aria-label={c} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
      ) : null}
    </aside>
  );
};

export { ArchiveBox };
