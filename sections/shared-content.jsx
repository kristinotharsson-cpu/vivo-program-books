import React, { useState, useEffect, useRef } from 'react';
import { Editable, PlainField, PhotoSlot, SharedNotice, PdfImport } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';

// ---- VIVO SHARED (audience info / staff / boards / supporters) ----
// Pulls all content from window.VIVO_SHARED — same data on every show, edited once.
const VivoAccordion = ({ id, title, subtitle, accent, brush, brushColor, index, count, children, defaultOpen }) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const accentMap = {
    magenta: "var(--vivo-plum)", tangerine: "var(--vivo-tangerine)", orange: "var(--vivo-orange)", azure: "var(--vivo-blue)",
    violet: "var(--vivo-plum)", green: "var(--vivo-green)", plum: "var(--vivo-plum)"
  };
  const bg = accentMap[accent] || "var(--vivo-plum)";
  // Orange bars take black text; the illustration switches to plum on orange/tangerine for contrast.
  const isTangerine = /tangerine|orange/.test(accent || "");
  const darkText = /orange/.test(accent || "");
  const brushSrc = brush ? `assets/illustrations/${brush}-${isTangerine ? "plum" : "tangerine"}.png` : null;
  return (
    <div className={"vivo-accordion " + (open ? "is-open" : "")}>
      <button
        className="vivo-banner"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`vivo-panel-${id}`}
        style={{ background: bg, color: darkText ? "var(--vivo-black)" : undefined }}
      >
        {brushSrc ? (
          <img className="vivo-banner-stripe" src={brushSrc} alt="" aria-hidden="true" style={{ "--i": index || 0, "--n": count || 1 }} onError={(e) => e.target.style.display = "none"} />
        ) : null}
        <span className="vivo-banner-text">
          <span className="vivo-banner-title">{title}</span>
          {subtitle ? <span className="vivo-banner-sub">{subtitle}</span> : null}
        </span>
        <span className="vivo-banner-chev" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="vivo-panel" id={`vivo-panel-${id}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
};

const VIVO_ABOUT_DEFAULT = {
  intro: [
    "Formerly Celebrity Series of Boston and founded in 1938, Vivo Performing Arts presents nearly 100 performances per year across Boston and beyond.",
    "Our name is new, but our mission hasn't changed. From Celebrity Series to Vivo Performing Arts, our mission is the same as always: to enrich and inspire our community through exceptional live performances."
  ],
  sections: [
    { h: "Subscription Series", body: [
      "The core of our work since 1938: we unite audiences and exceptional artists at venues across Boston, Cambridge, and beyond — inspiring wonder and sparking a lifelong interest in the performing arts.",
      "One of the nation's most highly regarded independent presenting organizations, we partner with established, internationally-acclaimed artists as well as emerging talent to curate a diverse lineup. We present artists at all career stages, not just the biggest names."
    ] },
    { h: "Arts for All!", body: [
      "Top Boston-based and Boston-affiliated artists perform free and low-cost concerts through Neighborhood Arts, often brought to life through deep collaboration with youth and community arts groups at venues across our city.",
      "Our Take Your Seat ticketing program makes subscription-season performances accessible for community organizations and school groups, and Artist Connections brings masterclasses and workshops to students of all ability levels."
    ] },
    { h: "Public Performance Projects", body: [
      "Now an annual tradition, we present free outdoor projects in some of Boston's most iconic public spaces: Street Pianos Boston, Jazz Along the Charles on the Esplanade, Let's Dance Boston on the Rose Kennedy Greenway, and more."
    ] },
    { h: "Land Acknowledgement", body: [
      "We acknowledge that Vivo Performing Arts presents performances in multiple venues around Boston which reside on traditional ancestral and unceded lands of the Massachusett tribe. We honor their people — past, present, and emerging — and their connection to the land on which we gather."
    ] }
  ]
};

const VivoSection = ({ s }) => {
  const shared = window.VIVO_SHARED || {};
  const about = (shared.about && (shared.about.intro || shared.about.sections)) ? shared.about : VIVO_ABOUT_DEFAULT;
  return (
    <div className="vivo-shared vivo-about">
      {(about.intro || []).map((p, i) => (
        <p key={i} className={i === 0 ? "lead" : "vivo-about-lead-p"}>{p}</p>
      ))}
      {(about.sections || []).map((sec, i) => (
        <div key={i} className="note-block vivo-about-block">
          <h3>{sec.h}</h3>
          {(sec.body || []).map((p, pi) => <p key={pi}>{p}</p>)}
        </div>
      ))}
      <p className="vivo-about-cta-wrap">
        <a className="vivo-about-cta" href="https://www.vivoperformingarts.org/about/" target="_blank" rel="noopener noreferrer">
          More about Vivo Performing Arts<span aria-hidden="true">↗</span>
        </a>
      </p>
    </div>
  );
};

// ---- STAFF & BOARD (standalone module, editable — date-scoped like supporters) ----
const StaffBoardSection = ({ s }) => {
  const editing = useEditMode();
  const shared = window.VIVO_SHARED || {};
  const [staff, setStaff] = React.useState(() => shared.staff || s.staff || { departments: [], credits: [] });
  const [boards, setBoards] = React.useState(() => shared.boards || s.boards || { directors: [], advisors: [] });

  const persist = (nextStaff, nextBoards) => {
    if (window.VIVO_SHARED) { window.VIVO_SHARED.staff = nextStaff; window.VIVO_SHARED.boards = nextBoards; }
    else window.VIVO_SHARED = { staff: nextStaff, boards: nextBoards };
    try {
      var dstr = window.PROGRAM_DATA && window.PROGRAM_DATA.cover && window.PROGRAM_DATA.cover.date;
      var dnum = window.VivoStore && window.VivoStore.parseDate ? window.VivoStore.parseDate(dstr) : null;
      if (window.VivoStore && window.VivoStore.saveVersion) window.VivoStore.saveVersion("staffBoard", dnum, { staff: nextStaff, boards: nextBoards });
    } catch (e) {}
  };
  const editStaff = (fn) => {
    const next = { ...staff, credits: [...(staff.credits || [])], departments: (staff.departments || []).map(d => ({ ...d, members: (d.members || []).map(m => ({ ...m })) })) };
    fn(next); setStaff(next); persist(next, boards);
  };
  const editBoards = (fn) => {
    const next = { ...boards, directors: (boards.directors || []).map(m => ({ ...m })), advisors: (boards.advisors || []).map(m => ({ ...m })) };
    fn(next); setBoards(next); persist(staff, next);
  };

  const MemberList = ({ list, onEdit, roles, emails }) => (
    editing ? (
      <div className="sb-edit-list">
        {list.map((m, i) => (
          <div key={i} className="sb-edit-row">
            <PhotoSlot src={m.photoSrc || ""} size={40} initials="＋" alt={m.name}
              onChange={(src) => onEdit(l => { l[i].photoSrc = src; })}
              onClear={() => onEdit(l => { l[i].photoSrc = ""; })} />
            <input className="sup-input sb-in-name" value={m.name || ""} placeholder="Name" onChange={(e) => onEdit(l => { l[i].name = e.target.value; })} />
            <input className="sup-input sb-in-title" value={m.title || ""} placeholder={roles ? "Role" : "Title"} onChange={(e) => onEdit(l => { l[i].title = e.target.value; })} />
            {emails ? <input className="sup-input sb-in-email" value={m.email || ""} placeholder="Email (optional)" onChange={(e) => onEdit(l => { l[i].email = e.target.value; })} /> : null}
            <button className="sup-del-tier" title="Remove" onClick={() => onEdit(l => l.splice(i, 1))}>×</button>
          </div>
        ))}
        <button className="sup-add-name" onClick={() => onEdit(l => l.push({ name: "", title: "" }))}>+ Add person</button>
      </div>
    ) : (
      <ul className={"vivo-staff-list" + (roles ? " is-roles" : "")}>
        {list.map((m, j) => (
          <li key={j} className={m.photoSrc ? "has-photo" : ""}>
            {m.photoSrc ? <PhotoSlot src={m.photoSrc} size={40} alt={m.name} className="sb-photo" /> : null}
            <div className="vivo-staff-text">
              {emails && m.email ? <a className="vivo-staff-name vivo-staff-namelink" href={`mailto:${m.email}`}>{m.name}</a> : <span className="vivo-staff-name">{m.name}</span>}
              {m.title ? <span className="vivo-staff-title">{m.title}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    )
  );

  return (
    <div className="vivo-shared sb-section">
      {React.createElement(SharedNotice, null)}
      {editing ? (
        <p className="sup-scope-note">Edits apply to this program and every later-dated program; earlier programs keep their existing roster.</p>
      ) : null}

      <div className="sb-block">
        <h3 className="vivo-band-title">Staff</h3>
        {(staff.departments || []).map((d, di) => (
          <div key={di} className="vivo-dept">
            {editing ? (
              <div className="sup-tier-head">
                <input className="sup-input sup-input-tier" value={d.name || ""} placeholder="Department" onChange={(e) => editStaff(n => { n.departments[di].name = e.target.value; })} />
                <button className="sup-del-tier" title="Delete department" onClick={() => editStaff(n => n.departments.splice(di, 1))}>×</button>
              </div>
            ) : (
              <h4 className="vivo-dept-h">{d.name}</h4>
            )}
            {d.inline && !editing ? (
              <p className="vivo-dept-inline">{d.inline}</p>
            ) : d.inline ? (
              <textarea className="sup-input sb-in-inline" value={d.inline} placeholder="Comma-separated names" onChange={(e) => editStaff(n => { n.departments[di].inline = e.target.value; })} />
            ) : (
              <MemberList list={d.members || []} emails={/advancement/i.test(d.name || "")} onEdit={(fn) => editStaff(n => fn(n.departments[di].members || (n.departments[di].members = [])))} />
            )}
          </div>
        ))}
        {editing ? (
          <div className="sb-add-row">
            <button className="sup-add-tier" onClick={() => editStaff(n => n.departments.push({ name: "New Department", members: [{ name: "", title: "" }] }))}>+ Add department</button>
            <button className="sup-add-tier" onClick={() => editStaff(n => n.departments.push({ name: "New Group", inline: "" }))}>+ Add inline group</button>
          </div>
        ) : null}
        {(staff.credits || []).length > 0 ? (
          <div className="vivo-staff-credits">
            {staff.credits.map((c, i) => <p key={i}>{c}</p>)}
          </div>
        ) : null}
      </div>

      <div className="sb-block">
        <h3 className="vivo-band-title">Board of Directors</h3>
        {boards.intro ? <p className="sb-board-intro">{boards.intro}</p> : null}
        <MemberList list={boards.directors || []} roles onEdit={(fn) => editBoards(n => fn(n.directors))} />
      </div>

      {(boards.emeriti || []).length || editing ? (
        <div className="sb-block">
          <h3 className="vivo-band-title">Board of Directors, Emeriti</h3>
          <MemberList list={boards.emeriti || []} roles onEdit={(fn) => editBoards(n => fn(n.emeriti || (n.emeriti = [])))} />
        </div>
      ) : null}

      <div className="sb-block">
        <h3 className="vivo-band-title">Board of Advisors</h3>
        <MemberList list={boards.advisors || []} roles onEdit={(fn) => editBoards(n => fn(n.advisors))} />
        {boards.legend ? <p className="sb-board-legend">{boards.legend}</p> : null}
      </div>
      {editing ? React.createElement(PdfImport, { label: "Import staff & board from PDF", hint: "Upload a staff/board PDF and we'll read names, titles, and departments into the lists above. Shared content — applies to this program and later.", onImport: () => new Promise((res) => setTimeout(() => { editStaff(n => (n.departments || (n.departments = [])).push({ name: "Imported Department", members: [{ name: "Imported Name", title: "Title" }] })); res(); }, 900)) }) : null}
    </div>
  );
};

// ---- VIVO SUPPORTERS (standalone module, editable — updates every show) ----
// Names are edited as one comma-separated list per tier. A name that itself contains a
// comma or a title goes in parentheses: (Smith, Jr.), (The Hon. Inés Vargas, Chair).
const parseDonorList = (text) => {
  const out = []; let buf = ""; let depth = 0;
  String(text == null ? "" : text).split("").forEach(ch => {
    if (ch === "(") { depth++; if (depth === 1) return; }
    if (ch === ")") { if (depth > 0) { depth--; if (depth === 0) return; } }
    if ((ch === "," || ch === "\n") && depth === 0) { if (buf.trim()) out.push(buf.trim()); buf = ""; return; }
    buf += ch;
  });
  if (buf.trim()) out.push(buf.trim());
  return out;
};
const serializeDonorList = (donors) => (donors || []).filter(d => d && d.trim())
  .map(d => /,/.test(d) ? "(" + d.trim() + ")" : d.trim()).join(", ");
const SupportersSection = ({ s }) => {
  const editing = useEditMode();
  const shared = window.VIVO_SHARED || {};
  const [sup, setSup] = React.useState(() => (shared.supporters) || s.supporters || { categories: [] });

  const commit = (next) => {
    setSup(next);
    if (window.VIVO_SHARED) window.VIVO_SHARED.supporters = next;
    else window.VIVO_SHARED = { supporters: next };
    try {
      var dstr = window.PROGRAM_DATA && window.PROGRAM_DATA.cover && window.PROGRAM_DATA.cover.date;
      var dnum = window.VivoStore && window.VivoStore.parseDate ? window.VivoStore.parseDate(dstr) : null;
      if (window.VivoStore && window.VivoStore.saveSupportersVersion) window.VivoStore.saveSupportersVersion(dnum, next);
    } catch (e) {}
  };
  const editCats = (fn) => { const cats = sup.categories.map(c => ({ ...c, tiers: (c.tiers || []).map(t => ({ ...t, donors: [...(t.donors || [])] })) })); fn(cats); commit({ ...sup, categories: cats }); };

  return (
    <div className="vivo-shared">
      <div className="vivo-band">
        <p className="vivo-band-lead">Vivo Performing Arts is sustained by an extraordinary community of donors, members, and partners. Tap any category below to see the names that make our season possible.</p>
        {editing ? (
          <p className="sup-scope-note">Edits here apply to this program and every later-dated program. Programs dated earlier keep their existing supporter list.</p>
        ) : null}
        {React.createElement(SharedNotice, null)}
        <div className="sup-bars">
        {(sup.categories || []).map((cat, ci) => (
          <VivoAccordion
            key={cat.id || ci}
            id={cat.id || ("sup-" + ci)}
            title={cat.title}
            accent={cat.accent}
            brush="rhythm"
            index={ci}
            count={(sup.categories || []).length}
            defaultOpen={editing}
          >
            {editing ? (
              <div className="sup-cat-edit">
                <input className="sup-input sup-input-title" value={cat.title || ""} placeholder="Category title"
                  onChange={(e) => editCats(cs => { cs[ci].title = e.target.value; })} />
                <button className="sup-del-cat" title="Delete category" onClick={() => editCats(cs => cs.splice(ci, 1))}>Delete category</button>
              </div>
            ) : null}
            {cat.intro ? <p className="vivo-cat-intro">{cat.intro}</p> : null}
            {(cat.tiers || []).map((tier, ti) => (
              <div key={ti} className="vivo-tier">
                {editing ? (
                  <div className="sup-tier-head">
                    <input className="sup-input sup-input-amount" value={tier.amount || ""} placeholder="$ / level"
                      onChange={(e) => editCats(cs => { cs[ci].tiers[ti].amount = e.target.value; })} />
                    <input className="sup-input sup-input-tier" value={tier.label || ""} placeholder="Tier label"
                      onChange={(e) => editCats(cs => { cs[ci].tiers[ti].label = e.target.value; })} />
                    <button className="sup-del-tier" title="Delete tier" onClick={() => editCats(cs => cs[ci].tiers.splice(ti, 1))}>×</button>
                  </div>
                ) : (
                  <div className="vivo-tier-label">
                    {tier.amount ? <span className="vivo-tier-chip">{tier.amount}</span> : null}
                    <span className="vivo-tier-name">{tier.label}</span>
                  </div>
                )}
                {editing ? (
                  <div className="sup-donor-edit">
                    <textarea
                      className="sup-donor-box"
                      value={tier.donorsText != null ? tier.donorsText : serializeDonorList(tier.donors)}
                      placeholder="Paste names separated by commas. Wrap a name that contains a comma in parentheses: (Smith, Jr.)"
                      onChange={(e) => editCats(cs => {
                        cs[ci].tiers[ti].donorsText = e.target.value;
                        cs[ci].tiers[ti].donors = parseDonorList(e.target.value);
                      })}
                    />
                    <p className="sup-donor-hint">{(tier.donors || []).filter(Boolean).length} names — they'll set in columns when you're done. Names with a comma or title go in parentheses.</p>
                  </div>
                ) : (
                  <ul className="vivo-tier-donors">{(tier.donors || []).filter(Boolean).map((d, di) => <li key={di}>{d}</li>)}</ul>
                )}
              </div>
            ))}
            {editing ? (
              <button className="sup-add-tier" onClick={() => editCats(cs => cs[ci].tiers.push({ label: "New tier", donors: [""] }))}>+ Add tier</button>
            ) : null}
          </VivoAccordion>
        ))}
        </div>
        {editing ? (
          <button className="sup-add-cat" onClick={() => editCats(cs => cs.push({ id: "cat-" + Date.now(), title: "New category", accent: "magenta", brush: "rhythm", tiers: [{ label: "New tier", donors: [""] }] }))}>+ Add category</button>
        ) : null}
        {sup.footer ? <p className="vivo-supporters-footer">{sup.footer}</p> : null}
      </div>
    </div>
  );
};

export { VivoAccordion, VivoSection, StaffBoardSection, SupportersSection };
