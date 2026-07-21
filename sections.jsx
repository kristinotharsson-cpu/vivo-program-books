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
const ProgramSection = ({ s, update, displayStyle, allSections, onGoSection, cover }) => {
  const editing = window.__editMode;
  const pieces = s.pieces || [];
  const setPieces = (next) => update({ pieces: next });
  const patchPiece = (i, patch) => { const n = [...pieces]; n[i] = { ...n[i], ...patch }; setPieces(n); };
  const addPiece = () => setPieces([...pieces, { composer: "", work: "", movements: [] }]);
  const addIntermission = () => setPieces([...pieces, { kind: "intermission" }]);
  const removePiece = (i) => { const n = [...pieces]; n.splice(i, 1); setPieces(n); };
  const movePiece = (i, dir) => { const n = [...pieces]; const j = i + dir; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setPieces(n); };
  const addMovement = (i) => patchPiece(i, { movements: [...(pieces[i].movements || []), ""] });
  const noteSections = (allSections || []).filter(x => x.kind === "notes" || x.kind === "info");
  const [rawOpen, setRawOpen] = React.useState(false);
  const [rawText, setRawText] = React.useState("");
  // Parse pasted raw program text into structured pieces (APPENDED to existing).
  const autoFormat = () => {
    const blocks = rawText.replace(/\r/g, "").split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const out = [];
    blocks.forEach(block => {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      lines.forEach((ln, idx) => {
        if (/^intermission$/i.test(ln)) { out.push({ kind: "intermission" }); return; }
        if (idx === 0) {
          const m = ln.match(/^(.+?)\s*[—–-]\s*(.+)$/) || ln.match(/^(.+?),\s*(.+)$/);
          if (m) out.push({ composer: m[1].trim(), work: m[2].trim(), movements: [] });
          else out.push({ composer: ln, work: "", movements: [] });
        } else {
          const cur = out[out.length - 1];
          if (cur && !cur.kind) { if (!cur.work) cur.work = ln; else cur.movements.push(ln); }
        }
      });
    });
    if (out.length) { setPieces([...pieces, ...out]); setRawText(""); setRawOpen(false); }
  };
  const resetProgram = () => {
    if (!confirm("Reset this Program page? Clears all pieces and freeform HTML.")) return;
    update({ pieces: [], html: "" });
    setRawOpen(false); setRawText("");
  };
  return (
  <div>
    {cover ? (
      <div className="program-perf-head">
        <div className="program-perf-title">{cover.title}{cover.subtitle ? <span className="program-perf-sub"> — {cover.subtitle}</span> : null}</div>
        <div className="program-perf-meta">
          {[cover.date, cover.time, cover.venue].filter(Boolean).join("\u00A0\u00A0\u00A0")}
        </div>
      </div>
    ) : null}
    {(s.subtitle || editing) ? (
      <Editable as="p" className="section-subtitle" value={s.subtitle || ""} onChange={v => update({ subtitle: v })} multiline />
    ) : null}
    {(s.runtimeNote || editing) ? (
      <Editable as="p" className="program-runtime" value={s.runtimeNote || ""} onChange={v => update({ runtimeNote: v })} multiline />
    ) : null}
    <ol className={"program-list" + ((s.displayStyle || displayStyle) === "centered" ? " is-centered" : "")}>
      {pieces.map((p, i) => {
        if (p.kind === "intermission") {
          return (
            <li key={i} className="program-divider">— Intermission —
              {editing ? <span className="prog-edit"><button onClick={() => movePiece(i, -1)}>↑</button><button onClick={() => movePiece(i, 1)}>↓</button><button onClick={() => removePiece(i)}>✕</button></span> : null}
            </li>
          );
        }
        const noteHref = p.noteId ? "#/" + p.noteId : null;
        return (
          <li key={i} className="program-item">
            <Editable as="div" className="composer" value={p.composer} onChange={v => patchPiece(i, { composer: v })} />
            {noteHref && !editing ? (
              <a className="work work-link" href={noteHref} onClick={(e) => { e.preventDefault(); onGoSection && onGoSection(p.noteId); }}>{p.work}</a>
            ) : (
              <Editable as="div" className="work" value={p.work} onChange={v => patchPiece(i, { work: v })} multiline />
            )}
            {(p.meta || editing) ? (
              <Editable as="div" className="meta" value={p.meta || ""} onChange={v => patchPiece(i, { meta: v })} />
            ) : null}
            {p.movements && p.movements.length > 0 ? (
              <div className="movements">
                {p.movements.map((m, mi) => (
                  <Editable key={mi} as="span" className="mvt" value={m} onChange={v => {
                    const movements = [...p.movements]; movements[mi] = v; patchPiece(i, { movements });
                  }} />
                ))}
              </div>
            ) : null}
            {editing ? (
              <div className="prog-edit">
                <button onClick={() => addMovement(i)}>+ Movement</button>
                <button onClick={() => movePiece(i, -1)}>↑</button>
                <button onClick={() => movePiece(i, 1)}>↓</button>
                <button onClick={() => removePiece(i)}>Delete</button>
                <label className="prog-note-link">Link to note:
                  <select value={p.noteId || ""} onChange={(e) => patchPiece(i, { noteId: e.target.value })}>
                    <option value="">None</option>
                    {noteSections.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                </label>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>

    {/* Freeform HTML block — renders after the structured list, so both coexist */}
    {editing ? (
      <div className="prog-html-edit">
        <div className="prog-help">
          <strong>Freeform HTML (optional).</strong> Anything here renders below the list above — mix presets and custom HTML freely. Links: <code>&lt;a href="#/notes"&gt;text&lt;/a&gt;</code>. Saves as you type; turn off Edit to preview.
        </div>
        <textarea className="prog-html-input" value={s.html || ""} placeholder="<p>Optional custom HTML…</p>" onChange={(e) => update({ html: e.target.value })} />
      </div>
    ) : (s.html ? <div className="prog-html" dangerouslySetInnerHTML={{ __html: s.html }} /> : null)}

    {editing && rawOpen ? (
      <div className="prog-html-edit">
        <div className="prog-help">
          <strong>Paste raw text — rules:</strong>
          <ol className="prog-rules">
            <li>Separate each piece with a <strong>blank line</strong>.</li>
            <li>The <strong>first line</strong> of a piece is the composer and work. Split them with a <strong>dash (—)</strong> or a <strong>comma</strong>: <code>Beethoven — Sonata No. 21, Op. 53</code>.</li>
            <li>Every <strong>following line</strong> in that piece becomes a <strong>movement</strong>.</li>
            <li>Type <code>INTERMISSION</code> on its own line for a break.</li>
            <li>Auto-format <strong>appends</strong> to what's already on the page (it won't erase your presets).</li>
          </ol>
        </div>
        <textarea className="prog-html-input" value={rawText} placeholder={"Ludwig van Beethoven — Sonata No. 21 in C major, Op. 53 \u201cWaldstein\u201d\nAllegro con brio\nRondo: Allegretto moderato\n\nINTERMISSION\n\nFrédéric Chopin — Ballade No. 4 in F minor, Op. 52"} onChange={(e) => setRawText(e.target.value)} />
        <div className="prog-edit prog-edit-add">
          <button onClick={autoFormat}>Auto-format & append</button>
          <button onClick={() => { setRawOpen(false); setRawText(""); }}>Cancel</button>
        </div>
      </div>
    ) : null}

    {editing ? (
      <div className="prog-help">
        <strong>Linking a piece to a note:</strong> use the <em>Link to note</em> dropdown on any piece to connect it to a Program Notes or Info page — the title becomes a "Read note →" link. Anywhere you type text, <code>[label](#/section-id)</code> also makes a link.
      </div>
    ) : null}
    {editing ? (
      <div className="prog-edit prog-edit-add">
        <button onClick={addPiece}>+ Add Piece</button>
        <button onClick={addIntermission}>+ Intermission</button>
        <button onClick={() => { setRawOpen(true); setRawText(""); }}>Paste raw text</button>
        <button onClick={resetProgram}>Reset page</button>
      </div>
    ) : null}
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
            <button onClick={() => { if (!confirm("Delete this note?")) return; update({ sections: s.sections.filter((_, j) => j !== i) }); }}>Delete note</button>
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
const CastRow = ({ c, i, list, listKey, update, bios, onGoBio }) => {
  const initials = (c.name || "").split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const setItem = (patch) => {
    const next = [...list]; next[i] = { ...c, ...patch }; update({ [listKey]: next });
  };
  const remove = () => {
    if (!confirm("Delete this row?")) return;
    const next = list.filter((_, j) => j !== i); update({ [listKey]: next });
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
    </li>
  );
};

const CastSection = ({ s, update, bios, onGoBio }) => (
  <div>
    <h3 className="cast-section-h">The Performer</h3>
    <ul className="cast-list">
      {s.cast.map((c, i) => (
        <CastRow key={i} c={c} i={i} list={s.cast} listKey="cast" update={update} bios={bios} onGoBio={onGoBio} />
      ))}
    </ul>
    <AddRowButton label="Add performer" onAdd={() => update({ cast: [...s.cast, { role: "Role", name: "Name" }] })} />
    <h3 className="cast-section-h is-second">Creative & Production</h3>
    <ul className="cast-list">
      {s.creative.map((c, i) => (
        <CastRow key={i} c={c} i={i} list={s.creative} listKey="creative" update={update} bios={bios} onGoBio={onGoBio} />
      ))}
    </ul>
    <AddRowButton label="Add credit" onAdd={() => update({ creative: [...s.creative, { role: "Role", name: "Name" }] })} />
  </div>
);

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
  const [open, setOpen] = useStateS({ 0: true });
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
    update({ bios: [...s.bios, { id, name: "New Name", role: "Role", initials: "NN", photoSrc: "", body: ["Biography text…"] }] });
  };
  const removeBio = (i) => {
    if (!confirm("Delete this bio?")) return;
    update({ bios: s.bios.filter((_, j) => j !== i) });
  };
  return (
    <div>
      <ul className="bio-list">
        {s.bios.map((b, i) => (
          <li
            key={b.id || i}
            className={"bio-item" + (open[i] ? " is-open" : "")}
            data-bio-id={b.id || ""}
          >
            <div className="bio-toggle-row">
              <button className="bio-toggle" onClick={() => setOpen({ ...open, [i]: !open[i] })}>
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
                  <Editable as="div" className="bio-name" value={b.name} onChange={v => {
                    const bios = [...s.bios]; bios[i] = { ...b, name: v }; update({ bios });
                  }} />
                  <Editable as="div" className="bio-role" value={b.role} onChange={v => {
                    const bios = [...s.bios]; bios[i] = { ...b, role: v }; update({ bios });
                  }} />
                </div>
                <Icon name="chev-down" size={20} />
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
      <AddRowButton label="Add bio" onAdd={addBio} />
    </div>
  );
};

// ---- DONORS ----
const DonorsSection = ({ s, update }) => (
  <div>
    {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
    {s.tiers.map((t, i) => (
      <div key={i} className={"donor-tier" + (t.level === "leader" ? " tier-leader" : "")}>
        <Editable as="h3" value={t.name} onChange={v => {
          const tiers = [...s.tiers]; tiers[i] = { ...t, name: v }; update({ tiers });
        }} />
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
// Auto-populates from shows/manifest.json (the next few shows after this one),
// each card linking to that show's program. Set s.auto = false to hand-curate.
const EventsSection = ({ s, update }) => {
  const editing = window.__editMode;
  const [auto, setAuto] = React.useState([]);
  const isAuto = s.auto !== false;
  React.useEffect(() => {
    if (!isAuto) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get("show");
    fetch("shows/manifest.json").then(r => r.json()).then(list => {
      const sorted = [...list].filter(m => m.iso).sort((a, b) => a.iso.localeCompare(b.iso));
      const self = sorted.find(m => m.slug === slug);
      const after = self ? sorted.filter(m => m.iso > self.iso) : sorted;
      const take = (after.length ? after : sorted).slice(0, s.count || 4);
      setAuto(take.map(m => {
        const d = new Date(m.iso + "T00:00");
        return {
          month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
          day: String(d.getUTCDate()),
          title: m.title,
          meta: [m.leadArtist !== m.title ? m.leadArtist : null, m.venue].filter(Boolean).join("   "),
          href: m.eventUrl || ("Program Book.html?show=" + m.slug),
          websiteUrl: m.eventUrl || ("https://vivoperformingarts.org/events/" + m.slug),
          slug: m.slug,
          thumb: (s.thumbs && s.thumbs[m.slug]) || m.thumb || "",
          accent: m.accent || "plum"
        };
      }));
    }).catch(() => {});
  }, [isAuto, s.count, s.thumbs]);

  const events = isAuto ? auto : (s.events || []);
  const linkTo = s.linkTo || "program";
  return (
    <div>
      {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
      {isAuto && editing ? (
        <div className="st-song-modes" role="group" aria-label="Link destination">
          <span className="st-song-modes-hint">Cards link to:</span>
          <button aria-pressed={linkTo === "program"} onClick={() => update({ linkTo: "program" })}>Program page</button>
          <button aria-pressed={linkTo === "website"} onClick={() => update({ linkTo: "website" })}>Vivo Performing Arts website</button>
        </div>
      ) : null}
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
            const dest = linkTo === "website" ? e.websiteUrl : e.href;
            const ext = /^https?:/.test(dest);
            const setThumb = (src) => update({ thumbs: { ...(s.thumbs || {}), [e.slug]: src } });
            if (editing) {
              return (
                <li key={i} className="event-card event-card-edit">
                  <div className="event-date">
                    <span className="month">{e.month}</span>
                    <span className="day">{e.day}</span>
                  </div>
                  <PhotoSlot className={"event-thumb accent-" + (e.accent || "plum")} src={e.thumb} alt={e.title} onChange={setThumb} onClear={() => setThumb("")} size={60} />
                  <div className="event-info">
                    <div className="title">{e.title}</div>
                    <div className="meta">{e.meta}</div>
                  </div>
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
        {blocks.map((b, i) => (
          <div key={i} className="perf-sponsor-block">
            <Editable as="div" className="perf-sponsor-label" value={b.label} onChange={v => updateBlock(i, { label: v })} />
            <Editable as="div" className="perf-sponsor-name" value={b.name} onChange={v => updateBlock(i, { name: v })} />
            {b.statement !== undefined ? (
              <Editable as="p" className="perf-sponsor-statement" value={b.statement} onChange={v => updateBlock(i, { statement: v })} multiline />
            ) : null}
            {window.__editMode ? (
              <button className="perf-sponsor-remove" onClick={() => removeBlock(i)} aria-label="Remove sponsor block">Remove</button>
            ) : null}
          </div>
        ))}
        {window.__editMode ? (
          <button className="perf-sponsor-add" onClick={addBlock}>+ Add sponsor block</button>
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
const InfoSection = ({ s, update }) => (
  <div>
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

// ---- VIVO SHARED (audience info / staff / boards / supporters) ----
// Pulls all content from window.VIVO_SHARED — same data on every show, edited once.
const VivoAccordion = ({ id, title, subtitle, accent, brush, brushColor, children, defaultOpen }) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const accentMap = {
    magenta: "var(--vivo-plum)", tangerine: "var(--vivo-orange)", azure: "var(--vivo-blue)",
    violet: "var(--vivo-plum)", green: "var(--vivo-green)", plum: "var(--vivo-plum)"
  };
  const bg = accentMap[accent] || "var(--vivo-plum)";
  const brushSrc = brush ? `assets/illustrations/${brush}-${brushColor || "cream"}.png` : null;
  return (
    <div className={"vivo-accordion " + (open ? "is-open" : "")}>
      <button
        className="vivo-banner"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`vivo-panel-${id}`}
        style={{ background: bg }}
      >
        {brushSrc ? (
          <img className="vivo-banner-brush" src={brushSrc} alt="" aria-hidden="true" onError={(e) => e.target.style.display = "none"} />
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

const VivoSection = ({ s }) => {
  const shared = window.VIVO_SHARED;
  if (!shared) {
    return (
      <div className="vivo-shared-empty">
        <p>Vivo institutional content not loaded. Check that <code>shows/_vivo-shared.json</code> is reachable.</p>
      </div>
    );
  }
  const audience = shared.audienceInfo || [];
  const staff = shared.staff || { departments: [] };
  const boards = shared.boards || {};
  const supporters = shared.supporters || { categories: [] };

  return (
    <div className="vivo-shared">
      {/* Audience Information */}
      <div className="vivo-band">
        <h3 className="vivo-band-title">Audience Information</h3>
        {audience.map((item, i) => (
          <VivoAccordion
            key={item.id}
            id={item.id}
            title={item.title}
            accent="green"
            defaultOpen={false}
          >
            {(item.body || []).map((p, pi) => <p key={pi}>{p}</p>)}
          </VivoAccordion>
        ))}
      </div>

      {/* Vivo Performing Arts: Staff + Boards */}
      <div className="vivo-band">
        <h3 className="vivo-band-title">Vivo Performing Arts</h3>
        <VivoAccordion id="staff" title="Staff Listing" accent="plum" defaultOpen={false}>
          {(staff.departments || []).map((d, i) => (
            <div key={i} className="vivo-dept">
              <h4 className="vivo-dept-h">{d.name}</h4>
              {d.inline ? (
                <p className="vivo-dept-inline">{d.inline}</p>
              ) : (
                <ul className="vivo-staff-list">
                  {(d.members || []).map((m, j) => (
                    <li key={j}>
                      <span className="vivo-staff-name">{m.name}</span>
                      {m.title ? <span className="vivo-staff-title">, {m.title}</span> : null}
                      {m.email ? (
                        <a className="vivo-staff-email" href={`mailto:${m.email}`}>{m.email}</a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {(staff.credits || []).length > 0 ? (
            <div className="vivo-staff-credits">
              {staff.credits.map((c, i) => <p key={i}>{c}</p>)}
            </div>
          ) : null}
        </VivoAccordion>
        <VivoAccordion id="boards" title="Board Listing" accent="plum" defaultOpen={false}>
          {boards._note ? <p className="vivo-note">{boards._note}</p> : null}
          {(boards.directors || []).length > 0 ? (
            <div className="vivo-dept">
              <h4 className="vivo-dept-h">Board of Directors</h4>
              <ul className="vivo-staff-list">
                {boards.directors.map((m, j) => (
                  <li key={j}>
                    <span className="vivo-staff-name">{m.name}</span>
                    {m.title ? <span className="vivo-staff-title">, {m.title}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(boards.advisors || []).length > 0 ? (
            <div className="vivo-dept">
              <h4 className="vivo-dept-h">Advisory Board</h4>
              <ul className="vivo-staff-list">
                {boards.advisors.map((m, j) => (
                  <li key={j}>
                    <span className="vivo-staff-name">{m.name}</span>
                    {m.title ? <span className="vivo-staff-title">, {m.title}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </VivoAccordion>
      </div>

      {/* Vivo Supporters */}
      <div className="vivo-band">
        <h3 className="vivo-band-title">Vivo Supporters</h3>
        <p className="vivo-band-lead">Vivo Performing Arts is sustained by an extraordinary community of donors, members, and partners. Tap any category below to see the names that make our season possible.</p>
        {(supporters.categories || []).map((cat) => (
          <VivoAccordion
            key={cat.id}
            id={cat.id}
            title={cat.title}
            accent={cat.accent}
            brush={cat.brush}
            brushColor="cream"
            defaultOpen={false}
          >
            {cat.intro ? <p className="vivo-cat-intro">{cat.intro}</p> : null}
            {(cat.tiers || []).map((tier, ti) => (
              <div key={ti} className="vivo-tier">
                <div className="vivo-tier-label">{tier.label}</div>
                <p className="vivo-tier-donors">
                  {(tier.donors || []).join(" ")}
                </p>
              </div>
            ))}
          </VivoAccordion>
        ))}
        {supporters.footer ? (
          <p className="vivo-supporters-footer">{supporters.footer}</p>
        ) : null}
      </div>
    </div>
  );
};

// ---- Main switcher ----
const SectionBody = ({ section, update, allSections, onGoSection, expandedBioId, onClearExpandedBio, displayStyle, defaultTransMode, cover }) => {
  const biosSection = allSections?.find(s => s.kind === "bios");
  const onGoBio = (bioId) => {
    if (!biosSection) return;
    onGoSection?.(biosSection.id, { expandedBioId: bioId });
  };
  switch (section.kind) {
    case "welcome": return <WelcomeSection s={section} update={update} />;
    case "program": return <ProgramSection s={section} update={update} displayStyle={displayStyle} allSections={allSections} onGoSection={onGoSection} cover={cover} />;
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
    default: return null;
  }
};

Object.assign(window, { SectionBody });
