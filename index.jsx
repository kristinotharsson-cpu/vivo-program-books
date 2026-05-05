// Vivo Season Index — 80-show browser
// Loads shows/manifest.json, lets users search + filter, links to Program Book.html?show=<slug>

const { useState, useEffect, useMemo } = React;

// ---------- New Program helpers ----------
const STARTER_GENRES = [
  { value: "Classical", label: "Classical" },
  { value: "Jazz", label: "Jazz" },
  { value: "Dance", label: "Dance" },
  { value: "Pop/World", label: "Pop / World" },
  { value: "Spoken Word", label: "Spoken Word" },
  { value: "Other", label: "Other / Neighborhood Arts" },
];
const STARTER_ACCENTS = [
  { value: "plum", label: "Plum" },
  { value: "tangerine", label: "Tangerine" },
  { value: "orange", label: "Orange" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "lavender", label: "Lavender" },
];

function slugify(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || ("program-" + Date.now());
}

function makeStarterJson(form) {
  const slug = slugify(form.title + (form.isoDate ? "-" + form.isoDate.replace(/-/g, "") : ""));
  const initials = (form.title).split(/\s+/).map(w => (w[0] || "").toUpperCase()).filter(Boolean).join("").slice(0, 2) || "VA";
  return {
    slug,
    cover: {
      eyebrow: "Vivo Performing Arts presents",
      title: form.title,
      subtitle: form.subtitle || "",
      date: form.date || "",
      time: form.time || "",
      venue: form.venue || "",
      accent: form.accent || "plum",
      brush: "harmony",
      photoCaption: form.title,
      calloutLabel: "A note from President and Executive Director",
      calloutName: "Gary Dunning",
      presentedBy: "",
      footerSponsor: null
    },
    sections: [
      {
        id: "welcome", title: "Welcome", kind: "welcome",
        eyebrow: "From the Artistic Director",
        quote: "Welcome to Vivo Performing Arts.",
        body: ["We are delighted to present " + form.title + ". Thank you for joining us tonight."],
        signature: { name: "Gary Dunning", role: "President and Executive Director, Vivo Performing Arts" }
      },
      {
        id: "program", title: "Program", kind: "program",
        eyebrow: "The Running Order",
        lead: "Program to be announced from the stage.",
        pieces: [{ composer: "Artist", work: "To be announced from the stage.", meta: "" }]
      },
      {
        id: "artist", title: "Cast & Creative", kind: "cast",
        eyebrow: "On Stage Tonight",
        cast: [{ role: form.subtitle || "Artist", name: form.title }],
        creative: []
      },
      {
        id: "bios", title: "Artist Bios", kind: "bios",
        eyebrow: "Tonight's Artist",
        bios: [{
          id: slugify(form.title), name: form.title, role: form.subtitle || "Artist",
          initials, photoSrc: "",
          body: ["Biography to be added. Click Edit Content in the menu to fill in this section."]
        }]
      },
      {
        id: "vivo", kind: "vivo", title: "About Vivo Performing Arts",
        eyebrow: "Audience Information · Staff · Supporters"
      },
      {
        id: "info", title: "Hall Info", kind: "info", eyebrow: "Visitor Info",
        sections: [
          { h: "Venue", body: [form.venue || "Venue to be confirmed."] },
          { h: "Land Acknowledgment", body: ["Vivo Performing Arts gathers and performs on the unceded ancestral lands of the Massachusett, Pawtucket, and Wampanoag peoples."] },
          { h: "Contact", body: ["Box Office · (617) 555-0140 · tickets@vivo.org · vivo.org"] }
        ]
      }
    ],
    _meta: {
      iso: form.isoDate || "",
      genre: form.genre || "Other",
      venueName: form.venue || "",
      leadArtist: form.title,
      ensembleCount: 1,
      _local: true
    }
  };
}

function NewProgramModal({ onClose }) {
  const [form, setForm] = useState({
    title: "", subtitle: "", date: "", isoDate: "", time: "", venue: "", genre: "Classical", accent: "plum"
  });
  const [creating, setCreating] = useState(false);
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    const showData = makeStarterJson(form);
    const slug = showData.slug;
    try {
      localStorage.setItem("vivo-pb-data:" + slug, JSON.stringify(showData));
      const existing = JSON.parse(localStorage.getItem("vivo-new-shows") || "[]");
      if (!existing.includes(slug)) {
        localStorage.setItem("vivo-new-shows", JSON.stringify([...existing, slug]));
      }
    } catch (ex) {}
    window.location.href = "Program Book.html?show=" + slug;
  };

  return (
    <div className="idx-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="idx-modal" role="dialog" aria-modal="true">
        <header className="idx-modal-head">
          <h2>New Program Book</h2>
          <button className="idx-modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form className="idx-modal-form" onSubmit={handleSubmit}>
          <label className="idx-modal-field">
            <span>Program / Artist Name <strong>*</strong></span>
            <input required value={form.title} onChange={set("title")} placeholder="e.g. Víkingur Ólafsson" autoFocus />
          </label>
          <label className="idx-modal-field">
            <span>Genre / Instrument / Type</span>
            <input value={form.subtitle} onChange={set("subtitle")} placeholder="e.g. Piano" />
          </label>
          <div className="idx-modal-row">
            <label className="idx-modal-field">
              <span>Display Date</span>
              <input value={form.date} onChange={set("date")} placeholder="e.g. SAT SEP 12" />
            </label>
            <label className="idx-modal-field">
              <span>Date (for sorting)</span>
              <input value={form.isoDate} onChange={set("isoDate")} type="date" />
            </label>
            <label className="idx-modal-field">
              <span>Time</span>
              <input value={form.time} onChange={set("time")} placeholder="e.g. 7:30PM" />
            </label>
          </div>
          <label className="idx-modal-field">
            <span>Venue</span>
            <input value={form.venue} onChange={set("venue")} placeholder="e.g. Symphony Hall" />
          </label>
          <div className="idx-modal-row">
            <label className="idx-modal-field">
              <span>Genre</span>
              <select value={form.genre} onChange={set("genre")}>
                {STARTER_GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </label>
            <label className="idx-modal-field">
              <span>Cover Color</span>
              <select value={form.accent} onChange={set("accent")}>
                {STARTER_ACCENTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>
          </div>
          <div className="idx-modal-actions">
            <button type="button" className="idx-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="idx-modal-submit" disabled={creating || !form.title.trim()}>
              {creating ? "Creating…" : "Create Program Book →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Genre code → display label
const GENRE_LABEL = {
  "PPP": "Public Performance Project",
  "WMIG": "Women's Music & Ideas Gathering",
  "Ch Orch": "Chamber Orchestra",
  "Pop/World": "Pop / World",
};
const genreLabel = s => {
  if (!s) return "";
  if ((s.tags || []).includes("Draft")) return "Draft";
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

function App() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("upcoming");
  const [showPast, setShowPast] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
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
      .then(data => {
        // Merge locally-created programs
        const serverSlugs = new Set(data.map(s => s.slug));
        let newSlugs = [];
        try { newSlugs = JSON.parse(localStorage.getItem("vivo-new-shows") || "[]"); } catch (e) {}
        const localShows = newSlugs
          .filter(slug => !serverSlugs.has(slug))
          .map(slug => {
            try {
              const d = JSON.parse(localStorage.getItem("vivo-pb-data:" + slug) || "{}");
              if (!d.cover) return null;
              return {
                slug: d.slug || slug,
                title: d.cover.title || slug,
                leadArtist: d.cover.title || slug,
                date: d.cover.date || "DRAFT",
                time: d.cover.time || "",
                iso: (d._meta && d._meta.iso) || new Date().toISOString().slice(0, 10),
                venue: d.cover.venue || "TBD",
                genre: (d._meta && d._meta.genre) || "Other",
                tags: ["Draft"],
                accent: d.cover.accent || "plum",
                _local: true
              };
            } catch (ex) { return null; }
          }).filter(Boolean);
        setShows([...data, ...localShows]);
        setLoading(false);
      })
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

  const filtered = useMemo(() => {
    const grp = FILTERS.find(g => g.id === genreFilter);
    const q = query.trim().toLowerCase();
    const ctx = { upcoming: upcomingSlugs };
    return shows.filter(s => {
      if (grp && !grp.match(s, ctx)) return false;
      if (!q) return true;
      const haystack = [s.title, s.leadArtist, s.venue, s.genre, s.date, ...(s.tags||[])].join(" ").toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => {
      const ai = parseDateMeta(a.iso, a.date).ts;
      const bi = parseDateMeta(b.iso, b.date).ts;
      return ai - bi;
    });
  }, [shows, query, genreFilter, upcomingSlugs]);

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
          <button className="idx-new-btn" onClick={() => setShowNewModal(true)}>+ New Program</button>
          <a href="https://vivo.org" target="_blank" rel="noopener">vivo.org ↗</a>
        </div>
      </header>

      {showNewModal && <NewProgramModal onClose={() => setShowNewModal(false)} />}

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
        </div>
      </div>

      {loading && <div className="idx-results-count">Loading…</div>}
      {error && <div className="idx-results-count">Couldn't load shows: {error}</div>}

      {!loading && !error && (
        <>
          <div className="idx-results-count">
            {upcomingShows.length} upcoming{pastShows.length > 0 && <> · {pastShows.length} past</>} · {shows.length} total
            {query && <> · "{query}"</>}
            {genreFilter !== "all" && <> · {FILTERS.find(g => g.id === genreFilter)?.label}</>}
          </div>

          {filtered.length === 0 ? (
            <div className="idx-empty">
              <h2>No programs found</h2>
              <p>Try a different search term or clear the filter.</p>
              <button onClick={() => { setQuery(""); setGenreFilter("upcoming"); }}>Reset filters</button>
            </div>
          ) : view === "grid" ? (
            <>
              {upcomingShows.length > 0 && <GridView items={upcomingShows} />}
              {pastShows.length > 0 && (
                <>
                  <PastDivider count={pastShows.length} open={showPast} onToggle={() => setShowPast(p => !p)} />
                  {showPast && <GridView items={pastShows} past />}
                </>
              )}
            </>
          ) : (
            <>
              {upcomingGroups.length > 0 && <ListView groups={upcomingGroups} />}
              {pastShows.length > 0 && (
                <>
                  <PastDivider count={pastShows.length} open={showPast} onToggle={() => setShowPast(p => !p)} />
                  {showPast && <ListView groups={pastGroups} past />}
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

function GridView({ items, past }) {
  return (
    <div className="idx-grid">
      {items.map(s => {
        const d = compactDate(s.date);
        return (
          <a key={s.slug} className={"idx-card" + (past ? " idx-card-past" : "")} data-accent={s.accent || "purple"} href={`Program Book.html?show=${s.slug}`}>
            <div className="idx-card-genre">{genreLabel(s)}</div>
            <div className="idx-card-date">
              <span className="idx-card-day">{d.mon} {d.day}</span>
              <span className="idx-card-time">{s.time || ""}</span>
            </div>
            <h3 className="idx-card-title">{s.title}</h3>
            <p className="idx-card-artist">{s.leadArtist !== s.title ? s.leadArtist : ""}</p>
            <div className="idx-card-meta">
              <span>{s.venue}</span>
            </div>
            <span className="idx-card-arrow">→</span>
          </a>
        );
      })}
    </div>
  );
}

function ListView({ groups, past }) {
  return (
    <div className="idx-list">
      {groups.map(g => (
        <React.Fragment key={g.key}>
          <div className={"idx-list-month" + (past ? " idx-list-month-past" : "")}>{g.label}</div>
          {g.items.map(s => {
            const d = compactDate(s.date);
            return (
              <a key={s.slug} className={"idx-row" + (past ? " idx-row-past" : "")} href={`Program Book.html?show=${s.slug}`}>
                <div className="idx-row-date">
                  <span className="idx-row-day">{d.day}</span>
                  <span className="idx-row-time">{d.mon} · {s.time || "—"}</span>
                </div>
                <div className="idx-row-body">
                  <h3 className="idx-row-title">{s.title}</h3>
                  <div className="idx-row-meta">
                    {s.leadArtist && s.leadArtist !== s.title && <span>{s.leadArtist}</span>}
                    <span>{s.venue}</span>
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
