// Vivo Season Index — 80-show browser
// Loads shows/manifest.json, lets users search + filter, links to Program Book.html?show=<slug>

const { useState, useEffect, useMemo } = React;

// Genre code → display label
const GENRE_LABEL = {
  "PPP": "Public Performance Project",
  "WMIG": "Women's Music & Ideas Gathering",
  "Ch Orch": "Chamber Orchestra",
  "Pop/World": "Pop / World",
};
const genreLabel = s => {
  if (!s) return "";
  // Tag-based override: Neighborhood Arts trumps the raw genre code
  if ((s.tags || []).includes("Neighborhood Arts")) return "Neighborhood Arts";
  const g = s.genre || "";
  return GENRE_LABEL[g] || g;
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTH_NAMES = {
  JAN: "January", FEB: "February", MAR: "March", APR: "April",
  MAY: "May", JUN: "June", JUL: "July", AUG: "August",
  SEP: "September", OCT: "October", NOV: "November", DEC: "December"
};

// Filter chips — match either by genre or by the show's tags array
const FILTERS = [
  { id: "all",          label: "All",               match: () => true },
  { id: "upcoming",     label: "Upcoming",          match: (s, ctx) => ctx.upcoming.has(s.slug) },
  { id: "classical",    label: "Classical",         match: s => /Pianist|Chamber|Classical|Orchestra|Instrumentalist|Ch Orch|Vocal/.test(s.genre) },
  { id: "jazz",         label: "Jazz",              match: s => /Jazz/.test(s.genre) },
  { id: "dance",        label: "Dance",             match: s => /Dance|PPP/.test(s.genre) },
  { id: "world",        label: "World & Folk",      match: s => /Pop\/World/.test(s.genre) || /Other/.test(s.genre) },
  { id: "spoken",       label: "Spoken Word",       match: s => /Spoken Word|WMIG/.test(s.genre) },
  // Tag-based
  { id: "neighborhood", label: "Neighborhood Arts", match: s => (s.tags || []).includes("Neighborhood Arts") },
  { id: "piano",        label: "Piano",             match: s => (s.tags || []).includes("Piano") },
  { id: "roxbury",      label: "Roxbury",           match: s => (s.tags || []).includes("Roxbury") },
  { id: "festival",     label: "Festivals",         match: s => (s.tags || []).some(t => /Festival|Let's Dance/.test(t)) },
];

function parseDateMeta(iso, displayDate) {
  // displayDate like "SAT SEP 12"
  if (iso) {
    const d = new Date(iso + "T00:00:00");
    return { ts: d.getTime(), monthKey: MONTHS[d.getMonth()], year: d.getFullYear() };
  }
  // fallback parse from displayDate
  const m = (displayDate || "").match(/([A-Z]{3})\s+(\d+)/);
  if (m) {
    const monthKey = m[1];
    return { ts: 0, monthKey, year: 2026 };
  }
  return { ts: 0, monthKey: "", year: 2026 };
}

// Pull "SEP 12" out of "SAT SEP 12"
function compactDate(s) {
  const m = (s || "").match(/([A-Z]{3})\s+(\d+)/);
  return m ? { mon: m[1], day: m[2] } : { mon: "", day: s };
}

// Inline-editable text (contentEditable). Blocks link navigation while editing.
function IdxEditable({ value, field, slug, onEdit, as = "span", className, placeholder }) {
  const Tag = as;
  return (
    <Tag
      className={(className || "") + " idx-editable"}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder || ""}
      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
      onBlur={e => {
        const v = e.currentTarget.textContent.trim();
        if (v !== (value || "")) onEdit(slug, field, v);
      }}
    >{value}</Tag>
  );
}

function App() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("upcoming");
  const [showPast, setShowPast] = useState(false);
  const [edit, setEdit] = useState(false);
  const [overrides, setOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vivo-idx-overrides") || "{}"); } catch (e) { return {}; }
  });
  const [statuses, setStatuses] = useState({});
  useEffect(() => {
    if (window.VivoStore) window.VivoStore.listPrograms().then(setStatuses).catch(() => {});
  }, []);
  useEffect(() => { localStorage.setItem("vivo-idx-overrides", JSON.stringify(overrides)); }, [overrides]);
  const applyEdit = (slug, field, value) => {
    setOverrides(o => ({ ...o, [slug]: { ...(o[slug] || {}), [field]: value } }));
  };
  const todayTs = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.getTime();
  }, []);
  const [view, setView] = useState(() => {
    return localStorage.getItem("vivo-idx-view") || "list";
  });

  useEffect(() => {
    fetch("shows/manifest.json")
      .then(r => { if (!r.ok) throw new Error("manifest"); return r.json(); })
      .then(data => { setShows(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { localStorage.setItem("vivo-idx-view", view); }, [view]);

  // Mark each show upcoming/past based on today's date
  const upcomingSlugs = useMemo(() => {
    const set = new Set();
    shows.forEach(s => {
      const ts = s.iso ? new Date(s.iso + "T23:59:59").getTime() : 0;
      if (ts >= todayTs) set.add(s.slug);
    });
    return set;
  }, [shows, todayTs]);

  const mergedShows = useMemo(
    () => shows.map(s => {
      const st = statuses[s.slug];
      const base = overrides[s.slug] ? { ...s, ...overrides[s.slug] } : s;
      return { ...base, _status: st ? st.status : "empty", _updatedAt: st && st.updatedAt, _exportedAt: st && st.lastExportedAt };
    }),
    [shows, overrides, statuses]
  );

  const filtered = useMemo(() => {
    const grp = FILTERS.find(g => g.id === genreFilter);
    const q = query.trim().toLowerCase();
    const ctx = { upcoming: upcomingSlugs };
    return mergedShows.filter(s => {
      if (grp && !grp.match(s, ctx)) return false;
      if (!q) return true;
      const haystack = [s.title, s.leadArtist, s.venue, s.genre, s.date, ...(s.tags||[])].join(" ").toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => {
      const ai = parseDateMeta(a.iso, a.date).ts;
      const bi = parseDateMeta(b.iso, b.date).ts;
      return ai - bi;
    });
  }, [mergedShows, query, genreFilter, upcomingSlugs]);

  // Split into upcoming + past
  const { upcomingShows, pastShows } = useMemo(() => {
    const up = [], pa = [];
    filtered.forEach(s => upcomingSlugs.has(s.slug) ? up.push(s) : pa.push(s));
    return { upcomingShows: up, pastShows: pa };
  }, [filtered, upcomingSlugs]);

  function groupByMonth(items) {
    const out = [];
    let lastKey = null;
    for (const s of items) {
      const m = parseDateMeta(s.iso, s.date);
      const key = `${m.year}-${m.monthKey}`;
      if (key !== lastKey) {
        out.push({ key, label: `${MONTH_NAMES[m.monthKey] || m.monthKey} ${m.year}`, items: [] });
        lastKey = key;
      }
      out[out.length - 1].items.push(s);
    }
    return out;
  }
  const upcomingGroups = useMemo(() => groupByMonth(upcomingShows), [upcomingShows]);
  const pastGroups = useMemo(() => groupByMonth(pastShows), [pastShows]);

  return (
    <div className="idx-shell">
      <header className="idx-top">
        <a href="index.html" className="idx-brand">
          <span className="idx-brand-mark">V</span>
          <span>Vivo Performing Arts</span>
        </a>
        <div className="idx-top-right">
          <a href="https://vivoperformingarts.org" target="_blank" rel="noopener">vivoperformingarts.org ↗</a>
        </div>
      </header>

      <section className="idx-hero">
        <img className="idx-hero-logo" src="assets/logos/vivo-logo-black.png" alt="Vivo Performing Arts" />
        <h1>Program Books<br/><em>2026 / 27</em></h1>
        <div className="idx-hero-meta">
          <span><strong>{shows.length || "—"}</strong> programs</span>
          <span><strong>SEP 2026</strong> – <strong>JUN 2027</strong></span>
          <span>Boston</span>
        </div>
      </section>

      <div className="idx-controls">
        <div className="idx-controls-inner">
          <div className="idx-search">
            <svg className="idx-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="7" cy="7" r="5"/>
              <path d="m11 11 4 4"/>
            </svg>
            <input
              type="search"
              placeholder="Search artists, venues, programs…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search programs"
            />
            {query && (
              <button className="idx-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>
            )}
          </div>

          <div className="idx-filter-group" role="group" aria-label="Filter">
            {FILTERS.map(g => (
              <button
                key={g.id}
                className="idx-chip"
                aria-pressed={genreFilter === g.id}
                onClick={() => setGenreFilter(g.id)}
              >{g.label}</button>
            ))}
          </div>

          <div className="idx-view-toggle" role="group" aria-label="View">
            <button aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
            <button aria-pressed={view === "grid"} onClick={() => setView("grid")}>Grid</button>
          </div>

          <div className="idx-view-toggle idx-edit-toggle" role="group" aria-label="Edit">
            <button aria-pressed={edit} onClick={() => setEdit(e => !e)}>{edit ? "Done" : "Edit"}</button>
          </div>
        </div>
      </div>

      {loading && <div className="idx-results-count">Loading…</div>}
      {error && <div className="idx-results-count">Couldn't load shows: {error}</div>}

      {!loading && !error && (
        <>
          <div className="idx-results-count">
            {upcomingShows.length} upcoming{pastShows.length > 0 && <> {pastShows.length} past</>} {shows.length} total
            {query && <> "{query}"</>}
            {genreFilter !== "all" && <> {FILTERS.find(g => g.id === genreFilter)?.label}</>}
          </div>

          {filtered.length === 0 ? (
            <div className="idx-empty">
              <h2>No programs found</h2>
              <p>Try a different search term or clear the filter.</p>
              <button onClick={() => { setQuery(""); setGenreFilter("upcoming"); }}>Reset filters</button>
            </div>
          ) : view === "grid" ? (
            <>
              {upcomingShows.length > 0 && <GridView items={upcomingShows} edit={edit} onEdit={applyEdit} />}
              {pastShows.length > 0 && (
                <>
                  <PastDivider count={pastShows.length} open={showPast} onToggle={() => setShowPast(p => !p)} />
                  {showPast && <GridView items={pastShows} past edit={edit} onEdit={applyEdit} />}
                </>
              )}
            </>
          ) : (
            <>
              {upcomingGroups.length > 0 && <ListView groups={upcomingGroups} edit={edit} onEdit={applyEdit} />}
              {pastShows.length > 0 && (
                <>
                  <PastDivider count={pastShows.length} open={showPast} onToggle={() => setShowPast(p => !p)} />
                  {showPast && <ListView groups={pastGroups} past edit={edit} onEdit={applyEdit} />}
                </>
              )}
            </>
          )}
        </>
      )}

      <footer className="idx-foot">
        Program books are works in progress. Edits made on a program book persist in your browser; they don't change what other visitors see.
      </footer>
    </div>
  );
}

function PastDivider({ count, open, onToggle }) {
  return (
    <div className="idx-past-divider">
      <h2>Past performances</h2>
      <p>{count} program{count !== 1 ? "s" : ""} from earlier in the season</p>
      <button className="idx-past-toggle" onClick={onToggle}>
        {open ? "Hide" : "Show past"}
      </button>
    </div>
  );
}

// Relative "last edited" label
function relTime(iso) {
  if (!iso) return null;
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 90) return "just now";
  if (d < 3600) return Math.round(d / 60) + "m ago";
  if (d < 86400) return Math.round(d / 3600) + "h ago";
  if (d < 172800) return "yesterday";
  return Math.round(d / 86400) + "d ago";
}
function StatusBadge({ s }) {
  const status = s._status || "empty";
  const label = status === "published" ? "Published" : status === "draft" ? "Draft" : "Empty";
  const when = relTime(s._updatedAt);
  return (
    <div className="idx-status">
      <span className={"idx-status-badge is-" + status}>{label}</span>
      {status === "empty"
        ? <span className="idx-status-when">Awaiting PDF import</span>
        : when ? <span className="idx-status-when">Last edited {when}</span> : null}
    </div>
  );
}
function CardActions({ s }) {
  const go = (url) => (e) => { e.preventDefault(); e.stopPropagation(); location.assign(url); };
  return (
    <div className="idx-card-actions">
      <button className="idx-act" onClick={go(`Program Book.html?show=${s.slug}`)}>Open</button>
      {s._status !== "empty" ? (
        <button className="idx-act is-ghost" onClick={go(`Program Book.html?show=${s.slug}&export=1`)}>Export</button>
      ) : null}
    </div>
  );
}

function GridView({ items, past, edit, onEdit }) {
  return (
    <div className="idx-grid">
      {items.map(s => {
        const d = compactDate(s.date);
        return (
          <a key={s.slug} className={"idx-card" + (past ? " idx-card-past" : "") + (edit ? " is-editing" : "")} data-accent={s.accent || "purple"} href={`Program Book.html?show=${s.slug}`} onClick={e => { if (edit) e.preventDefault(); }}>
            <div className="idx-card-head">
              <div className="idx-card-date">
                <span className="idx-card-day">{d.mon} {d.day}</span>
                {edit
                  ? <IdxEditable className="idx-card-time" value={s.time || ""} field="time" slug={s.slug} onEdit={onEdit} placeholder="Time" />
                  : <span className="idx-card-time">{s.time || ""}</span>}
              </div>
              <div className="idx-card-genre">{genreLabel(s)}</div>
            </div>
            {edit
              ? <IdxEditable as="h3" className="idx-card-title" value={s.title} field="title" slug={s.slug} onEdit={onEdit} placeholder="Title" />
              : <h3 className="idx-card-title">{s.title}</h3>}
            {edit
              ? <IdxEditable as="p" className="idx-card-artist" value={s.leadArtist || ""} field="leadArtist" slug={s.slug} onEdit={onEdit} placeholder="Lead artist" />
              : <p className="idx-card-artist">{s.leadArtist !== s.title ? s.leadArtist : ""}</p>}
            <div className="idx-card-meta">
              {edit
                ? <IdxEditable value={s.venue || ""} field="venue" slug={s.slug} onEdit={onEdit} placeholder="Venue" />
                : <span>{s.venue}</span>}
            </div>
            <StatusBadge s={s} />
            <CardActions s={s} />
            <span className="idx-card-arrow">→</span>
          </a>
        );
      })}
    </div>
  );
}

function ListView({ groups, past, edit, onEdit }) {
  return (
    <div className="idx-list">
      {groups.map(g => (
        <React.Fragment key={g.key}>
          <div className={"idx-list-month" + (past ? " idx-list-month-past" : "")}>{g.label}</div>
          {g.items.map(s => {
            const d = compactDate(s.date);
            return (
              <a key={s.slug} className={"idx-row" + (past ? " idx-row-past" : "") + (edit ? " is-editing" : "")} href={`Program Book.html?show=${s.slug}`} onClick={e => { if (edit) e.preventDefault(); }}>
                <div className="idx-row-date">
                  <span className="idx-row-day">{d.day}</span>
                  {edit
                    ? <IdxEditable className="idx-row-time" value={s.time || ""} field="time" slug={s.slug} onEdit={onEdit} placeholder="Time" />
                    : <span className="idx-row-time">{d.mon} {s.time || "—"}</span>}
                </div>
                <div className="idx-row-body">
                  {edit
                    ? <IdxEditable as="h3" className="idx-row-title" value={s.title} field="title" slug={s.slug} onEdit={onEdit} placeholder="Title" />
                    : <h3 className="idx-row-title">{s.title}</h3>}
                  <div className="idx-row-meta">
                    {edit
                      ? <IdxEditable value={s.leadArtist || ""} field="leadArtist" slug={s.slug} onEdit={onEdit} placeholder="Lead artist" />
                      : (s.leadArtist && s.leadArtist !== s.title && <span>{s.leadArtist}</span>)}
                    {edit
                      ? <IdxEditable value={s.venue || ""} field="venue" slug={s.slug} onEdit={onEdit} placeholder="Venue" />
                      : <span>{s.venue}</span>}
                    <span className={"idx-status-badge is-" + (s._status || "empty")}>{s._status === "published" ? "Published" : s._status === "draft" ? "Draft" : "Empty"}</span>
                  </div>
                </div>
                <div className="idx-row-genre">{genreLabel(s)}</div>
              </a>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
