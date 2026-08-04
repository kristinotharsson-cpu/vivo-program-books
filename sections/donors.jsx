import React from 'react';
import { Editable, SectionBottomNav } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';

// ---- DONORS ----
const DonorsSection = ({ s, update }) => {
  const editing = useEditMode();
  return (
  <div>
    {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
    {s.tiers.map((t, i) => (
      <div key={i} className={"donor-tier" + (t.level === "leader" ? " tier-leader" : "")} style={t.accent ? { "--tier-accent": "var(--vivo-" + t.accent + ")" } : undefined}>
        <Editable as="h3" value={t.name} onChange={v => {
          const tiers = [...s.tiers]; tiers[i] = { ...t, name: v }; update({ tiers });
        }} />
        {editing ? (
          <div className="tier-color" contentEditable={false}>
            <span className="tier-color-label">Bar color</span>
            <div className="tier-swatches">
              <button className={"tier-sw tier-sw-none" + (!t.accent ? " is-on" : "")} title="Default" onClick={() => { const tiers = [...s.tiers]; tiers[i] = { ...t, accent: "" }; update({ tiers }); }} />
              {["plum","tangerine","orange","blue","sky-blue","green","light-green","lavender"].map(c => (
                <button key={c} className={"tier-sw" + (t.accent === c ? " is-on" : "")} style={{ background: "var(--vivo-" + c + ")" }} title={c} onClick={() => { const tiers = [...s.tiers]; tiers[i] = { ...t, accent: c }; update({ tiers }); }} />
              ))}
            </div>
          </div>
        ) : null}
        <ul className="donor-list">
          {t.names.map((n, ni) => (
            <li key={ni}>
              <Editable as="span" value={n} onChange={v => {
                const tiers = [...s.tiers];
                const names = [...t.names]; names[ni] = v;
                tiers[i] = { ...t, names };
                update({ tiers });
              }} />
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
  );
};

export { DonorsSection };
