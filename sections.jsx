// Vivo Program Book — Section page renderers
// Each section.kind gets a dedicated renderer

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

// ---- WELCOME ----
const WelcomeSection = ({ s, update }) => (
  <div className="welcome-page">
    <Editable as="div" className="welcome-quote" value={s.quote} onChange={v => update({ quote: v })} multiline />
    {s.body.map((p, i) => (
      <Editable key={i} as="p" value={p} onChange={v => {
        const body = [...s.body]; body[i] = v; update({ body });
      }} multiline />
    ))}
    <div className="signature">
      <Editable as="div" className="name" value={s.signature.name} onChange={v => update({ signature: { ...s.signature, name: v } })} />
      <Editable as="div" className="role" value={s.signature.role} onChange={v => update({ signature: { ...s.signature, role: v } })} />
    </div>
  </div>
);

// ---- PROGRAM ----
// Standard credit lines every Today's Program page carries.
const PROGRAM_STANDARD = {
  seasonSponsorsLabel: "Season Sponsors",
  massCultural: "Vivo Performing Arts is supported in part by the Mass Cultural Council, a state agency."
};
// The program is edited as one plain-text window. These two functions are the whole
// contract: pieces → text on the way in, text → pieces on the way out.
const serializeProgram = (pieces) => (pieces || []).map(p => {
  if (p.kind === "intermission") return "INTERMISSION";
  const head = [p.composer, p.work].filter(Boolean).join(" — ");
  const lines = [head];
  if (p.meta) lines.push("(" + p.meta + ")");
  (p.movements || []).forEach(m => { if (m) lines.push(m); });
  return lines.join("\n");
}).join("\n\n");
const parseProgram = (text) => {
  const out = [];
  String(text || "").replace(/\r/g, "").split(/\n\s*\n/).forEach(block => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    lines.forEach((ln, i) => {
      if (/^intermission$/i.test(ln)) { out.push({ kind: "intermission" }); return; }
      const cur = out.length ? out[out.length - 1] : null;
      if (i === 0 || !cur || cur.kind === "intermission") {
        const m = ln.match(/^(.+?)\s+[—–]\s+(.+)$/) || ln.match(/^(.+?)\s+-\s+(.+)$/);
        if (m) out.push({ composer: m[1].trim(), work: m[2].trim(), movements: [] });
        else out.push({ composer: ln, work: "", movements: [] });
        return;
      }
      if (/^\(.*\)$/.test(ln)) { cur.meta = ln.slice(1, -1).trim(); return; }
      if (!cur.work) { cur.work = ln; return; }
      cur.movements = [...(cur.movements || []), ln];
    });
  });
  return out;
};

const ProgramSection = ({ s, update, displayStyle, allSections, onGoSection, cover, updateCover }) => {
  const editing = window.__editMode;
  const pieces = s.pieces || [];
  const raw = s.rawProgram != null ? s.rawProgram : serializeProgram(pieces);
  const setRaw = (text) => update({ rawProgram: text, pieces: parseProgram(text) });
  const style = s.programStyle || (((s.displayStyle || displayStyle) === "centered") ? "dance" : "classical");
  const setStyle = (ps) => update({ programStyle: ps, displayStyle: ps === "dance" ? "centered" : "" });
  const sp = s.sponsor || {};
  const setSp = (patch) => update({ sponsor: { ...sp, ...patch } });
  // Legacy field name was "arrangements"; the line is a management credit.
  const mgmt = (sp.mgmtCredits && sp.mgmtCredits.length ? sp.mgmtCredits : (sp.arrangements || [])).filter(x => x != null);
  const setMgmt = (list) => setSp({ mgmtCredits: list, arrangements: undefined });
  const seasonLabel = sp.seasonSponsorsLabel || sp.label || PROGRAM_STANDARD.seasonSponsorsLabel;
  const seasonNames = sp.seasonSponsors != null ? sp.seasonSponsors : (sp.name || "");
  const massLine = sp.closing != null && sp.closing !== "" ? sp.closing : PROGRAM_STANDARD.massCultural;
  return (
  <div>
    {cover ? (() => {
      const hd = s.header || {};
      const gt = (k) => hd[k] != null && hd[k] !== "" ? hd[k] : (cover[k] || "");
      const title = hd.title != null && hd.title !== "" ? hd.title : cover.title;
      const subtitle = hd.subtitle != null ? hd.subtitle : cover.subtitle;
      const setH = (patch) => update({ header: { ...hd, ...patch } });
      if (editing) {
        return (
          <div className="program-perf-head is-editing">
            <div className="pf-grid">
              <PlainField label="Program name" value={title || ""} placeholder="Artist or program name" onChange={v => setH({ title: v })} />
              <PlainField label="Instrument / subtitle" value={subtitle || ""} placeholder="piano" onChange={v => setH({ subtitle: v })} />
              <PlainField label="Date" value={gt("date")} placeholder="Sunday, February 28, 2027" onChange={v => setH({ date: v })} />
              <PlainField label="Time" value={gt("time")} placeholder="3 PM" onChange={v => setH({ time: v })} />
              <PlainField label="Venue" value={gt("venue")} placeholder="Symphony Hall" onChange={v => setH({ venue: v })} />
            </div>
          </div>
        );
      }
      return (
        <div className="program-perf-head">
          <div className="program-perf-title">{title}{subtitle ? <span className="program-perf-sub">, {subtitle}</span> : null}</div>
          <div className="program-perf-meta">
            {[gt("date"), gt("time"), gt("venue")].filter(Boolean).join("\u00A0\u00A0\u00A0")}
          </div>
        </div>
      );
    })() : null}
    {(s.subtitle || editing) ? (
      <Editable as="p" className="section-subtitle" value={s.subtitle || ""} onChange={v => update({ subtitle: v })} multiline />
    ) : null}
    {editing ? (
      <div className="prog-style" contentEditable={false}>
        <span className="prog-style-label">Program style</span>
        <div className="prog-style-seg">
          {[["classical","Classical"],["dance","Dance"],["jazz","Jazz"],["custom","Custom"]].map(([v,l]) => (
            <button key={v} aria-pressed={style === v} onClick={() => setStyle(v)}>{l}</button>
          ))}
        </div>
      </div>
    ) : null}
    {editing ? (
      <div className="prog-raw" contentEditable={false}>
        <div className="prog-help">
          <strong>The program — one text box.</strong> Everything already on this page is below; edit it directly.
          <ol className="prog-rules">
            <li><strong>Blank line</strong> between pieces.</li>
            <li>First line of a piece: <code>COMPOSER — Work title</code> (em dash or hyphen).</li>
            <li>Each line after that is a <strong>movement</strong>.</li>
            <li>A line in <strong>parentheses</strong> is a credit under the work: <code>(Arr. Kurtág)</code>.</li>
            <li><code>INTERMISSION</code> on its own line.</li>
          </ol>
        </div>
        <textarea
          className="prog-html-input prog-raw-input"
          value={raw}
          placeholder={"LUDWIG VAN BEETHOVEN — Sonata No. 21 in C major, Op. 53 \u201cWaldstein\u201d\nAllegro con brio\nRondo: Allegretto moderato\n\nINTERMISSION\n\nFR\u00c9D\u00c9RIC CHOPIN — Ballade No. 4 in F minor, Op. 52\n(Arr. for two pianos)"}
          onChange={(e) => setRaw(e.target.value)}
        />
        <div className="prog-raw-preview-label">Preview</div>
      </div>
    ) : null}
    <ol className={"program-list" + (style === "dance" ? " is-centered" : "") + (style === "jazz" ? " is-jazz" : "") + (style === "custom" ? " is-custom" : "")}>
      {pieces.map((p, i) => {
        if (p.kind === "intermission") {
          return <li key={i} className="program-divider">Intermission</li>;
        }
        const noteHref = p.noteId ? "#/" + p.noteId : null;
        return (
          <li key={i} className="program-item">
            <div className="composer">{p.composer}</div>
            {noteHref && !editing ? (
              <a className="work work-link" href={noteHref} onClick={(e) => { e.preventDefault(); onGoSection && onGoSection(p.noteId); }}>{p.work}</a>
            ) : (
              <div className="work">{p.work}</div>
            )}
            {p.meta ? <div className="meta">{p.meta}</div> : null}
            {p.movements && p.movements.length > 0 ? (
              <div className="movements">
                {p.movements.map((m, mi) => <span key={mi} className="mvt">{m}</span>)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>

    {/* Runtime note renders BELOW the program list */}
    {editing ? (
      <PlainField className="prog-runtime-field" label="Run time note" value={s.runtimeNote || ""} placeholder="Approximately 1 hour 50 minutes, including intermission" onChange={v => update({ runtimeNote: v })} multiline />
    ) : (s.runtimeNote ? <p className="program-runtime" dangerouslySetInnerHTML={{ __html: s.runtimeNote }} /> : null)}

    {/* Extra rich text blocks (full formatting) below the program */}
    {(s.extras || []).map((p, i) => (
      <div key={i} className="prog-extra-block">
        <Editable as="p" className="prog-extra-text" value={p} onChange={v => { const extras = [...(s.extras || [])]; extras[i] = v; update({ extras }); }} multiline />
        {editing ? (
          <div className="prog-edit">
            <button onClick={() => { update({ extras: (s.extras || []).filter((_, j) => j !== i) }); window.__vivoToast && window.__vivoToast("Text block deleted · ⌘Z to undo"); }}>Delete</button>
          </div>
        ) : null}
      </div>
    ))}

    {/* Freeform HTML block — renders after the structured list, so both coexist */}
    {editing ? (
      <details className="advanced-html">
        <summary>Advanced — add custom HTML below the program</summary>
        <div className="prog-help">Optional. Renders below the program above. For staff comfortable with HTML; most programs never need this.</div>
        <textarea className="prog-html-input" value={s.html || ""} placeholder="<p>Optional custom HTML…</p>" onChange={(e) => update({ html: e.target.value })} />
      </details>
    ) : (s.html ? <div className="prog-html" dangerouslySetInnerHTML={{ __html: s.html }} /> : null)}

    {/* Credits & supporters — season sponsors and the Mass Cultural Council line are
        standard on every program page; performance and additional sponsors are optional. */}
    {editing ? (
      <div className="prog-sponsor-edit" contentEditable={false}>
        <h3 className="prog-sponsor-edit-h">Credits & supporters</h3>
        <div className="pf-grid">
          {(mgmt.length ? mgmt : [""]).map((line, i) => (
            <PlainField key={i} className="pf-wide" label={i === 0 ? "Management credit" : "Management credit " + (i + 1)}
              value={line} placeholder="[Artist] appears by arrangement with […]"
              onChange={v => { const a = mgmt.length ? [...mgmt] : [""]; a[i] = v; setMgmt(a); }} />
          ))}
        </div>
        <button className="prog-sp-addline" onClick={() => setMgmt([...(mgmt.length ? mgmt : [""]), ""])}>+ Management credit line</button>
        <div className="pf-grid">
          <PlainField label="Performance sponsor label" value={sp.perfSponsorLabel || ""} placeholder="Performance Sponsor" onChange={v => setSp({ perfSponsorLabel: v })} />
          <PlainField label="Performance sponsor name(s)" value={sp.perfSponsors || ""} placeholder="Susan & Michael Thonis" onChange={v => setSp({ perfSponsors: v })} />
          <PlainField label="Additional sponsor label" value={sp.additionalLabel || ""} placeholder="Additional support provided by" onChange={v => setSp({ additionalLabel: v })} />
          <PlainField label="Additional sponsor name(s)" value={sp.additionalSponsors || ""} placeholder="Jeremy Silverman & Mary Sutherland" onChange={v => setSp({ additionalSponsors: v })} />
          <PlainField label="Season sponsors label" value={seasonLabel} placeholder="Season Sponsors" onChange={v => setSp({ seasonSponsorsLabel: v })} />
          <PlainField label="Season sponsor name(s)" value={seasonNames} placeholder="Crescendo Donor Advised Fund and Susan & Michael Thonis" onChange={v => setSp({ seasonSponsors: v })} />
          <PlainField className="pf-wide" label="Other support statement (optional)" value={sp.publicSupport || ""} placeholder="Neighborhood Arts is supported by…" onChange={v => setSp({ publicSupport: v })} multiline />
          <PlainField className="pf-wide" label="Public agency line" value={massLine} onChange={v => setSp({ closing: v })} multiline />
        </div>
      </div>
    ) : (
      <div className="prog-sponsor">
        {mgmt.filter(x => x && x.trim()).length ? (
          <div className="prog-sp-arrangements">
            {mgmt.filter(x => x && x.trim()).map((line, i) => (
              <p key={i} className="prog-sp-arrangement" dangerouslySetInnerHTML={{ __html: line }} />
            ))}
          </div>
        ) : null}
        {sp.perfSponsors ? (
          <div className="prog-sp-season">
            <div className="prog-sp-season-label">{sp.perfSponsorLabel || "Performance Sponsor"}</div>
            <div className="prog-sp-season-names">{sp.perfSponsors}</div>
          </div>
        ) : null}
        {sp.additionalSponsors ? (
          <div className="prog-sp-season">
            <div className="prog-sp-season-label">{sp.additionalLabel || "Additional support provided by"}</div>
            <div className="prog-sp-season-names">{sp.additionalSponsors}</div>
          </div>
        ) : null}
        {seasonNames ? (
          <div className="prog-sp-season">
            <div className="prog-sp-season-label">{seasonLabel}</div>
            <div className="prog-sp-season-names">{seasonNames}</div>
          </div>
        ) : null}
        {sp.publicSupport ? <p className="prog-sp-support">{sp.publicSupport}</p> : null}
        <p className="prog-sp-closing">{massLine}</p>
      </div>
    )}
  </div>
  );
};

// ---- NOTES (long-form) ----
const NotesSection = ({ s, update }) => {
  const editing = window.__editMode;
  const slugify = (t, i) => "note-" + (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + i;
  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const sc = document.scrollingElement || document.documentElement;
    sc.scrollTo({ top: el.getBoundingClientRect().top + sc.scrollTop - 76, behavior: "smooth" });
  };
  const headed = (s.sections || []).map((sec, i) => ({ sec, i, id: slugify(sec.h, i) })).filter(x => (x.sec.h || "").trim());
  const showIndex = s.showIndex !== false && headed.length > 1;
  return (
  <div>
    <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline />
    {showIndex ? (
      <nav className="note-index" aria-label="Jump to a note">
        {headed.map(({ sec, id }) => (
          <button key={id} className="note-pill" onClick={() => jump(id)}>{sec.h}</button>
        ))}
      </nav>
    ) : null}
    {editing && headed.length > 1 ? (
      <div className="prog-edit" style={{ marginBottom: 14 }}>
        <button onClick={() => update({ showIndex: s.showIndex === false })}>{s.showIndex === false ? "Show" : "Hide"} note index</button>
      </div>
    ) : null}
    {s.sections.map((sec, i) => (
      <div key={i} id={slugify(sec.h, i)} className="note-block">
        <Editable as="h3" value={sec.h} onChange={v => {
          const sections = [...s.sections]; sections[i] = { ...sec, h: v }; update({ sections });
        }} />
        {(sec.sub || editing) ? (
          <Editable as="p" className="note-subtitle" value={sec.sub || ""} onChange={v => {
            const sections = [...s.sections]; sections[i] = { ...sec, sub: v }; update({ sections });
          }} multiline />
        ) : null}
        {sec.body.map((p, pi) => (
          <Editable key={pi} as="p" value={p} onChange={v => {
            const sections = [...s.sections];
            const body = [...sec.body]; body[pi] = v;
            sections[i] = { ...sec, body };
            update({ sections });
          }} multiline />
        ))}
        {editing ? (
          <div className="prog-edit">
            <button onClick={() => {
              const sections = [...s.sections]; sections[i] = { ...sec, body: [...(sec.body || []), ""] }; update({ sections });
            }}>+ Paragraph</button>
            <button onClick={() => { const sections = [...s.sections]; const j = i - 1; if (j < 0) return; [sections[i], sections[j]] = [sections[j], sections[i]]; update({ sections }); }}>↑</button>
            <button onClick={() => { const sections = [...s.sections]; const j = i + 1; if (j >= sections.length) return; [sections[i], sections[j]] = [sections[j], sections[i]]; update({ sections }); }}>↓</button>
            <button onClick={() => { update({ sections: s.sections.filter((_, j) => j !== i) }); window.__vivoToast && window.__vivoToast("Note deleted · ⌘Z to undo"); }}>Delete note</button>
          </div>
        ) : null}
      </div>
    ))}
    {editing ? (
      <div className="prog-edit prog-edit-add">
        <button onClick={() => update({ sections: [...(s.sections || []), { h: "New Note", body: [""] }] })}>+ Add Note</button>
      </div>
    ) : null}
    {s.author ? (
      <div className="signature">
        <Editable as="div" className="name" value={s.author.name} onChange={v => update({ author: { ...s.author, name: v } })} />
        <Editable as="div" className="role" value={s.author.role} onChange={v => update({ author: { ...s.author, role: v } })} />
      </div>
    ) : null}
  </div>
  );
};

// ---- SYNOPSIS / SETTING ----
const SynopsisSection = ({ s, update }) => (
  <div>
    <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline />
    {s.sections.map((sec, i) => (
      <div key={i}>
        <Editable as="h3" value={sec.h} onChange={v => {
          const sections = [...s.sections]; sections[i] = { ...sec, h: v }; update({ sections });
        }} />
        {sec.body.map((p, pi) => (
          <Editable key={pi} as="p" value={p} onChange={v => {
            const sections = [...s.sections];
            const body = [...sec.body]; body[pi] = v;
            sections[i] = { ...sec, body };
            update({ sections });
          }} multiline />
        ))}
      </div>
    ))}
  </div>
);

// ---- CAST & CREATIVE ----
const CastRow = ({ c, i, rows, onRows, bios, onGoBio }) => {
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
        {linkedBio && !window.__editMode ? (
          <button className="cast-name-link" onClick={() => onGoBio?.(linkedBio.id)}>{c.name}</button>
        ) : (
          <Editable as="span" value={c.name} onChange={v => setItem({ name: v })} />
        )}
        <RowControls onDelete={remove} label="row" />
      </span>
      {(c.blurb || window.__editMode) ? (
        <Editable as="p" className="cast-blurb" value={c.blurb || ""} data-placeholder="Optional bio blurb…" onChange={v => setItem({ blurb: v })} multiline />
      ) : null}
    </li>
  );
};

const CastSection = ({ s, update, bios, onGoBio }) => {
  const editing = window.__editMode;
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
  const editing = window.__editMode;
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
                  {(b.role || window.__editMode) ? <Editable as="div" className="bio-role" value={b.role || ""} data-ph="Role (optional)" onChange={v => { const bios = [...s.bios]; bios[i] = { ...b, role: v }; update({ bios }); }} /> : null}
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
        {React.createElement(window.PdfImport, { label: "Import bios from PDF", hint: "Upload a bios PDF and we'll read each artist's name, role, and biography into the fields above.", onImport: importBios })}
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
                  {(b.role || window.__editMode) ? (
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
      {React.createElement(window.PdfImport, { label: "Import bios from PDF", hint: "Upload a bios PDF and we'll read each artist's name, role, and biography into the fields above.", onImport: importBios })}
    </div>
  );
};

// ---- DONORS ----
const DonorsSection = ({ s, update }) => (
  <div>
    {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
    {s.tiers.map((t, i) => (
      <div key={i} className={"donor-tier" + (t.level === "leader" ? " tier-leader" : "")} style={t.accent ? { "--tier-accent": "var(--vivo-" + t.accent + ")" } : undefined}>
        <Editable as="h3" value={t.name} onChange={v => {
          const tiers = [...s.tiers]; tiers[i] = { ...t, name: v }; update({ tiers });
        }} />
        {window.__editMode ? (
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
  const editing = window.__editMode;
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

// ---- INFO (land ack, accessibility, safety, contact) ----
const VENUE_LINKS = {
  "arlington street church": "https://www.vivoperformingarts.org/in-the-community/discover/arlington-street-church/",
  "arrow street arts": "https://www.vivoperformingarts.org/in-the-community/discover/arrow-street-arts/",
  "berklee performance center": "https://www.vivoperformingarts.org/in-the-community/discover/berklee-performance-center/",
  "bethel ame church": "https://www.vivoperformingarts.org/in-the-community/discover/bethel-a-m-e-church/",
  "bethel a.m.e. church": "https://www.vivoperformingarts.org/in-the-community/discover/bethel-a-m-e-church/",
  "boch center wang theatre": "https://www.vivoperformingarts.org/in-the-community/discover/boch-center-wang-theatre/",
  "boston arts academy theater": "https://www.vivoperformingarts.org/in-the-community/discover/boston-arts-academy-theatre/",
  "boston arts academy theatre": "https://www.vivoperformingarts.org/in-the-community/discover/boston-arts-academy-theatre/",
  "boston public library roxbury branch": "https://www.vivoperformingarts.org/in-the-community/discover/boston-public-library-roxbury-branch/",
  "cutler majestic theatre at emerson college": "https://www.vivoperformingarts.org/in-the-community/discover/cutler-majestic-theatre-at-emerson-college/",
  "cutler majestic theatre": "https://www.vivoperformingarts.org/in-the-community/discover/cutler-majestic-theatre-at-emerson-college/",
  "crystal ballroom at somerville theatre": "https://www.vivoperformingarts.org/in-the-community/discover/crystal-ballroom-at-somerville-theatre/",
  "dewey square plaza": "https://www.vivoperformingarts.org/in-the-community/discover/dewey-square-plaza/",
  "first church roxbury": "https://www.vivoperformingarts.org/in-the-community/discover/first-church-roxbury/",
  "groton hill music center": "https://www.vivoperformingarts.org/in-the-community/discover/groton-hill-music-center/",
  "longy's pickman hall": "https://www.vivoperformingarts.org/in-the-community/discover/longy-s-pickman-hall/",
  "pickman hall": "https://www.vivoperformingarts.org/in-the-community/discover/longy-s-pickman-hall/",
  "multicultural arts center": "https://www.vivoperformingarts.org/in-the-community/discover/multicultural-arts-center/",
  "museum of science": "https://www.vivoperformingarts.org/in-the-community/discover/museum-of-science/",
  "nec's jordan hall": "https://www.vivoperformingarts.org/in-the-community/discover/nec-s-jordan-hall/",
  "jordan hall": "https://www.vivoperformingarts.org/in-the-community/discover/nec-s-jordan-hall/",
  "roxbury community college media arts center": "https://www.vivoperformingarts.org/in-the-community/discover/roxbury-community-college/",
  "salvation army kroc center": "https://www.vivoperformingarts.org/in-the-community/discover/salvation-army-kroc-center/",
  "sanders theatre": "https://www.vivoperformingarts.org/in-the-community/discover/sanders-theatre/",
  "symphony hall": "https://www.vivoperformingarts.org/in-the-community/discover/symphony-hall/",
  "twelfth baptist church": "https://www.vivoperformingarts.org/in-the-community/discover/twelfth-baptist-church/",
  "shaw-roxbury branch, boston public library": "https://www.vivoperformingarts.org/in-the-community/discover/boston-public-library-roxbury-branch/",
  "shaw goodman branch": "https://www.vivoperformingarts.org/in-the-community/discover/boston-public-library-roxbury-branch/",
  "roxbury community college": "https://www.vivoperformingarts.org/in-the-community/discover/roxbury-community-college/",
  "cathedral church of saint paul": "https://www.vivoperformingarts.org/in-the-community/discover/cathedral-church-of-st-paul/",
  "cathedral church of st paul": "https://www.vivoperformingarts.org/in-the-community/discover/cathedral-church-of-st-paul/",
  "first church, boston uu": "https://www.vivoperformingarts.org/in-the-community/discover/",
  "first church boston": "https://www.vivoperformingarts.org/in-the-community/discover/"
};
const _normVenue = (t) => (t || "").toLowerCase().replace(/['’.,]/g, "").replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
const _VENUE_NORM = Object.keys(VENUE_LINKS).map(k => [_normVenue(k), VENUE_LINKS[k]]).sort((a, b) => b[0].length - a[0].length);
const venueUrlFor = (text) => {
  const key = _normVenue(text);
  if (!key) return null;
  for (const [k, url] of _VENUE_NORM) { if (k === key) return url; }
  for (const [k, url] of _VENUE_NORM) { if (key.includes(k)) return url; }
  return null;
};
const InfoSection = ({ s, update }) => {
  const audienceInfo = (s.audienceInfo && s.audienceInfo.length) ? s.audienceInfo : ((window.VIVO_SHARED && window.VIVO_SHARED.audienceInfo) || []);
  const isLandAck = (sec) => /land\s*acknowledge?ment/i.test((sec.h || "").trim());
  // Land Acknowledgment always closes the page.
  const ordered = [...(s.sections || [])].map((sec, i) => ({ sec, i }))
    .sort((a, b) => (isLandAck(a.sec) ? 1 : 0) - (isLandAck(b.sec) ? 1 : 0));
  const renderBlock = ({ sec, i }) => {
      const isVenue = /^venue$/i.test((sec.h || "").trim());
      return (
      <div key={i} className={isLandAck(sec) ? "info-land-ack" : undefined}>
        <Editable as="h3" value={sec.h} onChange={v => {
          const sections = [...s.sections]; sections[i] = { ...sec, h: v }; update({ sections });
        }} />
        {isVenue && (sec.imageSrc || window.__editMode) ? (
          <div className="venue-photo">
            <PhotoSlot fill src={sec.imageSrc || ""} alt="Venue" initials="VENUE PHOTO"
              onChange={(src) => { const sections = [...s.sections]; sections[i] = { ...sec, imageSrc: src }; update({ sections }); }}
              onClear={() => { const sections = [...s.sections]; sections[i] = { ...sec, imageSrc: "" }; update({ sections }); }} />
          </div>
        ) : null}
        {sec.body.map((p, pi) => {
          const vUrl = isVenue && !window.__editMode ? venueUrlFor(p) : null;
          if (vUrl) return <p key={pi} className="venue-link-wrap"><a className="venue-btn" href={vUrl} target="_blank" rel="noopener noreferrer">{(p || "").replace(/\.$/, "")}<span className="venue-btn-arrow" aria-hidden="true">↗</span></a></p>;
          return (
          <Editable key={pi} as="p" value={p} onChange={v => {
            const sections = [...s.sections];
            const body = [...sec.body]; body[pi] = v;
            sections[i] = { ...sec, body };
            update({ sections });
          }} multiline />
          );
        })}
      </div>
      );
  };
  return (
  <div>
    {ordered.filter(x => !isLandAck(x.sec)).map(renderBlock)}
    {audienceInfo.length ? (
      <div className="vivo-band" style={{ marginTop: 24 }}>
        <h3 className="vivo-band-title">Audience Information</h3>
        {audienceInfo.map((item) => (
          <VivoAccordion key={item.id} id={item.id} title={item.title} accent="green" defaultOpen={false}>
            {(item.body || []).map((p, pi) => <p key={pi}>{p}</p>)}
          </VivoAccordion>
        ))}
      </div>
    ) : null}
    {ordered.filter(x => isLandAck(x.sec)).map(renderBlock)}
  </div>
  );
};

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
      "The core of our work since 1938: we unite audiences and exceptional artists at venues across Boston, Cambridge, and beyond \u2014 inspiring wonder and sparking a lifelong interest in the performing arts.",
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
      "We acknowledge that Vivo Performing Arts presents performances in multiple venues around Boston which reside on traditional ancestral and unceded lands of the Massachusett tribe. We honor their people \u2014 past, present, and emerging \u2014 and their connection to the land on which we gather."
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
  const editing = window.__editMode;
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
      {React.createElement(window.SharedNotice)}
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
      {editing ? React.createElement(window.PdfImport, { label: "Import staff & board from PDF", hint: "Upload a staff/board PDF and we'll read names, titles, and departments into the lists above. Shared content — applies to this program and later.", onImport: () => new Promise((res) => setTimeout(() => { editStaff(n => (n.departments || (n.departments = [])).push({ name: "Imported Department", members: [{ name: "Imported Name", title: "Title" }] })); res(); }, 900)) }) : null}
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
  const editing = window.__editMode;
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
        {React.createElement(window.SharedNotice)}
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

// ---- PROMO / AD (editable ad element — row / cta / image / partner) ----
const PROMO_BTN_COLORS = ["cream", "light-green", "lavender", "plum", "blue", "orange"];
const PROMO_BG_COLORS = ["plum", "tangerine", "orange", "blue", "sky-blue", "green", "light-green", "lavender", "cream", "black"];
const VIVO_HEX = { plum: "#BD2691", cream: "#FFFBEB", black: "#000000", tangerine: "#EF4C26", orange: "#FF9E1D", blue: "#007ACC", "sky-blue": "#39BDFF", green: "#1BC469", "light-green": "#CFFFA2", lavender: "#C4B1C9" };
const VIVO_ON_LIGHT = new Set(["cream", "light-green", "lavender", "sky-blue", "orange"]);
const PromoCards = ({ s, update }) => {
  const editing = window.__editMode;
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
  const editing = window.__editMode;
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

// ---- FROM THE ARCHIVES (box above the artist bio, default-on) ----
const ArchiveBox = ({ s, update }) => {
  const editing = window.__editMode;
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

// ---- Main switcher ----
const SectionBody = ({ section, update, allSections, onGoSection, expandedBioId, onClearExpandedBio, displayStyle, defaultTransMode, cover, updateCover }) => {
  const biosSection = allSections?.find(s => s.kind === "bios");
  const onGoBio = (bioId) => {
    if (!biosSection) return;
    onGoSection?.(biosSection.id, { expandedBioId: bioId });
  };
  switch (section.kind) {
    case "welcome": return <WelcomeSection s={section} update={update} />;
    case "program": return <ProgramSection s={section} update={update} displayStyle={displayStyle} allSections={allSections} onGoSection={onGoSection} cover={cover} updateCover={updateCover} />;
    case "notes": return <NotesSection s={section} update={update} />;
    case "synopsis": return <SynopsisSection s={section} update={update} />;
    case "cast": return <CastSection s={section} update={update} bios={biosSection?.bios} onGoBio={onGoBio} />;
    case "roster": return <RosterSection s={section} update={update} />;
    case "bios": return <BiosSection s={section} update={update} expandedId={expandedBioId} onClearExpanded={onClearExpandedBio} />;
    case "donors": return <DonorsSection s={section} update={update} />;
    case "events": return <EventsSection s={section} update={update} />;
    case "performance-sponsor": return <PerformanceSponsorSection s={section} update={update} />;
    case "sponsors": return <SponsorsSection s={section} update={update} />;
    case "info": return <InfoSection s={section} update={update} />;
    case "songtexts": return <window.SongTextsSection s={section} update={update} defaultMode={defaultTransMode} />;
    case "vivo": return <VivoSection s={section} update={update} />;
    case "supporters-list": return <SupportersSection s={section} update={update} />;
    case "staff-board": return <StaffBoardSection s={section} update={update} />;
    case "promo": return <PromoSection s={section} update={update} />;
    default: return null;
  }
};

Object.assign(window, { SectionBody });
