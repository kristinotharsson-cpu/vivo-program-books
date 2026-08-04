import React, { useState as useStateS, useEffect as useEffectS } from 'react';
import { Icon, Editable, PlainField, PhotoSlot, RowControls, AddRowButton, SectionBottomNav, PdfImport } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';
import { ArchiveBox } from './archive.jsx';

// ---- CAST & CREATIVE ----
const CastRow = ({ c, i, rows, onRows, bios, onGoBio }) => {
  const editing = useEditMode();
  const initials = (c.name || "").split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const setItem = (patch) => {
    const next = [...rows]; next[i] = { ...c, ...patch }; onRows(next);
  };
  const remove = () => {
    onRows(rows.filter((_, j) => j !== i));
    window.__vivoToast && window.__vivoToast("Row deleted · ⌘Z to undo");
  };
  // find matching bio by name (case-insensitive trim)
  const matchedBio = bios?.find(b => (b.name || "").trim().toLowerCase() === (c.name || "").trim().toLowerCase());
  const linkedBio = c.bioId ? bios?.find(b => b.id === c.bioId) : matchedBio;
  return (
    <li className="has-photo">
      <PhotoSlot
        src={c.photoSrc}
        initials={initials || "—"}
        alt={c.name}
        size={56}
        onChange={(src) => setItem({ photoSrc: src })}
        onClear={() => setItem({ photoSrc: "" })}
      />

      <Editable as="span" className="role" value={c.role} onChange={v => setItem({ role: v })} />
      <span className="name">
        {linkedBio && !editing ? (
          <button className="cast-name-link" onClick={() => onGoBio?.(linkedBio.id)}>{c.name}</button>
        ) : (
          <Editable as="span" value={c.name} onChange={v => setItem({ name: v })} />
        )}
        <RowControls onDelete={remove} label="row" />
      </span>
      {(c.blurb || editing) ? (
        <Editable as="p" className="cast-blurb" value={c.blurb || ""} data-placeholder="Optional bio blurb…" onChange={v => setItem({ blurb: v })} multiline />
      ) : null}
    </li>
  );
};

const CastSection = ({ s, update, bios, onGoBio }) => {
  const editing = useEditMode();
  const groups = s.groups || [
    { id: "cast", h: s.castHeading || "The Performer", rows: s.cast || [] },
    { id: "creative", h: s.creativeHeading || "Creative & Production", rows: s.creative || [] }
  ];
  const setGroups = (next) => update({ groups: next });
  const editGroup = (gi, fn) => {
    const next = groups.map(g => ({ ...g, rows: [...(g.rows || [])] }));
    fn(next[gi], next); setGroups(next);
  };
  return (
    <div>
      {groups.map((g, gi) => (
        <div key={g.id || gi} className="cast-group">
          <div className="cast-h-row">
            {editing ? (
              <input className="cast-h-input" value={g.h || ""} placeholder="Section heading"
                onChange={e => editGroup(gi, gg => { gg.h = e.target.value; })} />
            ) : (
              <h3 className={"cast-section-h" + (gi > 0 ? " is-second" : "")}>{g.h}</h3>
            )}
            {editing ? (
              <button className="cast-del-section" title="Delete section"
                onClick={() => { setGroups(groups.filter((_, j) => j !== gi)); window.__vivoToast && window.__vivoToast("Section deleted · ⌘Z to undo"); }}>Delete section</button>
            ) : null}
          </div>
          <ul className="cast-list">
            {(g.rows || []).map((c, i) => (
              <CastRow key={i} c={c} i={i} rows={g.rows || []} onRows={(next) => editGroup(gi, gg => { gg.rows = next; })} bios={bios} onGoBio={onGoBio} />
            ))}
          </ul>
          <AddRowButton label="Add credit" onAdd={() => editGroup(gi, gg => { gg.rows = [...(gg.rows || []), { role: "Role", name: "Name" }]; })} />
        </div>
      ))}
      {editing ? (
        <button className="cast-add-section" onClick={() => setGroups([...groups, { id: "grp-" + Date.now().toString(36), h: "New Section", rows: [{ role: "Role", name: "Name" }] }])}>+ Add section</button>
      ) : null}
    </div>
  );
};

// ---- ROSTER (musicians, board, staff) ----
const RosterSection = ({ s, update }) => (
  <div>
    {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
    {s.groups.map((g, i) => (
      <div key={i} className="roster-group">
        <Editable as="h3" value={g.h} onChange={v => {
          const groups = [...s.groups]; groups[i] = { ...g, h: v }; update({ groups });
        }} />
        <ul className="roster-list">
          {g.players.map((pl, pi) => (
            <li key={pi}>
              <Editable as="span" value={pl} onChange={v => {
                const groups = [...s.groups];
                const players = [...g.players]; players[pi] = v;
                groups[i] = { ...g, players };
                update({ groups });
              }} />
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

// ---- BIOS (expandable) ----
const BiosSection = ({ s, update, expandedId, onClearExpanded }) => {
  // Every bio starts collapsed — the page opens as a clean list of artists.
  const [open, setOpen] = useStateS({});
  // If an expandedId is provided, scroll to and open that bio
  useEffectS(() => {
    if (!expandedId) return;
    const idx = s.bios.findIndex(b => b.id === expandedId);
    if (idx < 0) return;
    setOpen(o => ({ ...o, [idx]: true }));
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-bio-id="${expandedId}"]`);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
      onClearExpanded?.();
    });
  }, [expandedId]);
  const addBio = () => {
    const id = "bio-" + Date.now().toString(36);
    update({ bios: [...s.bios, { id, name: "", role: "", initials: "", photoSrc: "", body: [""] }] });
    window.__vivoToast && window.__vivoToast("Artist added — scroll down to fill it in");
  };
  const removeBio = (i) => {
    update({ bios: s.bios.filter((_, j) => j !== i) });
    window.__vivoToast && window.__vivoToast("Bio deleted · ⌘Z to undo");
  };
  const importBios = () => new Promise((res) => setTimeout(() => {
    const id = "bio-" + Date.now().toString(36);
    update({ bios: [...s.bios, { id, name: "Imported Artist", role: "Role", initials: "IA", photoSrc: "", body: ["Biography imported from PDF — edit to finalize."] }] });
    res();
  }, 900));
  const layout = s.photoLayout || "thumbnail";
  const editing = useEditMode();
  const layoutCtl = editing ? (
    <div className="bio-layout-ctl" contentEditable={false}>
      <span className="bio-layout-label">Photo layout</span>
      <div className="bio-layout-seg">
        <button aria-pressed={layout === "thumbnail"} onClick={() => update({ photoLayout: "thumbnail" })}>Thumbnail</button>
        <button aria-pressed={layout === "full"} onClick={() => update({ photoLayout: "full" })}>Full width</button>
      </div>
    </div>
  ) : null;

  if (layout === "full") {
    return (
      <div>
        {layoutCtl}
        <ArchiveBox s={s} update={update} />
        <ul className="bio-list is-fullwidth">
          {s.bios.map((b, i) => (
            <li key={b.id || i} className="bio-item-full" data-bio-id={b.id || ""}>
              <div className="bio-banner">
                <PhotoSlot fill src={b.photoSrc} initials={b.initials || "GROUP PHOTO"} alt={b.name}
                  onChange={(src) => { const bios = [...s.bios]; bios[i] = { ...b, photoSrc: src }; update({ bios }); }}
                  onClear={() => { const bios = [...s.bios]; bios[i] = { ...b, photoSrc: "" }; update({ bios }); }} />
              </div>
              <div className="bio-full-head">
                <div className="bio-text">
                  <Editable as="div" className="bio-name" value={b.name} data-ph="Artist name…" onChange={v => { const bios = [...s.bios]; bios[i] = { ...b, name: v }; update({ bios }); }} />
                  {(b.role || editing) ? <Editable as="div" className="bio-role" value={b.role || ""} data-ph="Role (optional)" onChange={v => { const bios = [...s.bios]; bios[i] = { ...b, role: v }; update({ bios }); }} /> : null}
                </div>
                <RowControls onDelete={() => removeBio(i)} label="entry" />
              </div>
              <div className="bio-full-body">
                {(b.body || []).map((p, pi) => (
                  <Editable key={pi} as="p" value={p} onChange={v => { const bios = [...s.bios]; const body = [...b.body]; body[pi] = v; bios[i] = { ...b, body }; update({ bios }); }} multiline />
                ))}
              </div>
            </li>
          ))}
        </ul>
        <AddRowButton label="Add artist" onAdd={addBio} />
        {React.createElement(PdfImport, { label: "Import bios from PDF", hint: "Upload a bios PDF and we'll read each artist's name, role, and biography into the fields above.", onImport: importBios })}
      </div>
    );
  }

  return (
    <div>
      {layoutCtl}
      <ArchiveBox s={s} update={update} />
      <ul className="bio-list">
        {s.bios.map((b, i) => (
          <li
            key={b.id || i}
            className={"bio-item" + (open[i] ? " is-open" : "")}
            data-bio-id={b.id || ""}
          >
            <div className="bio-toggle-row">
              <button className="bio-toggle" onClick={() => setOpen({ ...open, [i]: !open[i] })} aria-expanded={!!open[i]}>
                <PhotoSlot
                  src={b.photoSrc}
                  initials={b.initials}
                  alt={b.name}
                  size={56}
                  className="bio-photo-slot"
                  onChange={(src) => {
                    const bios = [...s.bios]; bios[i] = { ...b, photoSrc: src }; update({ bios });
                  }}
                  onClear={() => {
                    const bios = [...s.bios]; bios[i] = { ...b, photoSrc: "" }; update({ bios });
                  }}
                />
                <div className="bio-text">
                  <Editable as="div" className="bio-name" value={b.name} data-ph="Artist name…" onChange={v => {
                    const bios = [...s.bios]; bios[i] = { ...b, name: v }; update({ bios });
                  }} />
                  {(b.role || editing) ? (
                    <Editable as="div" className="bio-role" value={b.role || ""} data-ph="Role (optional)" onChange={v => {
                      const bios = [...s.bios]; bios[i] = { ...b, role: v }; update({ bios });
                    }} />
                  ) : null}
                </div>
                <span className="bio-chev-btn" aria-hidden="true"><Icon name="chev-down" size={26} /></span>
              </button>
              <RowControls onDelete={() => removeBio(i)} label="bio" />
            </div>
            <div className="bio-body">
              <div className="inner">
                <div className="inner-pad">
                  {b.body.map((p, pi) => (
                    <Editable key={pi} as="p" value={p} onChange={v => {
                      const bios = [...s.bios];
                      const body = [...b.body]; body[pi] = v;
                      bios[i] = { ...b, body };
                      update({ bios });
                    }} multiline />
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <AddRowButton label="Add artist" onAdd={addBio} />
      {React.createElement(PdfImport, { label: "Import bios from PDF", hint: "Upload a bios PDF and we'll read each artist's name, role, and biography into the fields above.", onImport: importBios })}
    </div>
  );
};

export { CastSection, RosterSection, BiosSection };
