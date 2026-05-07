// Vivo Program Book — Section page renderers
// Each section.kind gets a dedicated renderer

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

// ---- WELCOME ----
const WelcomeSection = ({ s, update }) => (
  <div className="welcome-page">
    <Editable as="div" className="welcome-quote" value={s.quote} onChange={v => update({ quote: v })} multiline />
    {s.body.map((p, i) => (
      <Editable key={i} as="p" linkify value={p} onChange={v => {
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
const ProgramSection = ({ s, update }) => (
  <div>
    <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline />
    <ol className="program-list">
      {s.pieces.map((p, i) => {
        if (p.kind === "intermission") {
          return <li key={i} className="program-divider">— Intermission —</li>;
        }
        return (
          <li key={i} className="program-item">
            <Editable as="div" className="composer" value={p.composer} onChange={v => {
              const pieces = [...s.pieces]; pieces[i] = { ...p, composer: v }; update({ pieces });
            }} />
            <Editable as="div" className="work" value={p.work} onChange={v => {
              const pieces = [...s.pieces]; pieces[i] = { ...p, work: v }; update({ pieces });
            }} multiline />
            {p.meta ? (
              <Editable as="div" className="meta" value={p.meta} onChange={v => {
                const pieces = [...s.pieces]; pieces[i] = { ...p, meta: v }; update({ pieces });
              }} />
            ) : null}
            {p.movements && p.movements.length > 0 ? (
              <div className="movements">
                {p.movements.map((m, mi) => (
                  <Editable key={mi} as="span" className="mvt" value={m} onChange={v => {
                    const pieces = [...s.pieces];
                    const movements = [...p.movements]; movements[mi] = v;
                    pieces[i] = { ...p, movements };
                    update({ pieces });
                  }} />
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  </div>
);

// ---- NOTES (long-form) ----
const NotesSection = ({ s, update }) => (
  <div>
    <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline />
    {s.sections.map((sec, i) => (
      <div key={i}>
        <Editable as="h3" value={sec.h} onChange={v => {
          const sections = [...s.sections]; sections[i] = { ...sec, h: v }; update({ sections });
        }} />
        {sec.body.map((p, pi) => (
          <Editable key={pi} as="p" linkify value={p} onChange={v => {
            const sections = [...s.sections];
            const body = [...sec.body]; body[pi] = v;
            sections[i] = { ...sec, body };
            update({ sections });
          }} multiline />
        ))}
      </div>
    ))}
    {s.author ? (
      <div className="signature">
        <Editable as="div" className="name" value={s.author.name} onChange={v => update({ author: { ...s.author, name: v } })} />
        <Editable as="div" className="role" value={s.author.role} onChange={v => update({ author: { ...s.author, role: v } })} />
      </div>
    ) : null}
  </div>
);

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
          <Editable key={pi} as="p" linkify value={p} onChange={v => {
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
                    <Editable key={pi} as="p" linkify value={p} onChange={v => {
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
const EventsSection = ({ s, update }) => (
  <div>
    {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
    <ul className="event-list">
      {s.events.map((e, i) => (
        <li key={i} className="event-card">
          <div className="event-date">
            <Editable as="span" className="month" value={e.month} onChange={v => {
              const events = [...s.events]; events[i] = { ...e, month: v }; update({ events });
            }} />
            <Editable as="span" className="day" value={e.day} onChange={v => {
              const events = [...s.events]; events[i] = { ...e, day: v }; update({ events });
            }} />
          </div>
          <div className="event-info">
            <Editable as="div" className="title" value={e.title} onChange={v => {
              const events = [...s.events]; events[i] = { ...e, title: v }; update({ events });
            }} />
            <Editable as="div" className="meta" value={e.meta} onChange={v => {
              const events = [...s.events]; events[i] = { ...e, meta: v }; update({ events });
            }} multiline />
          </div>
        </li>
      ))}
    </ul>
  </div>
);

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
      <Editable as="p" className="lead" value={s.lead || ""} onChange={v => update({ lead: v })} multiline />
      <div className="perf-sponsor-blocks">
        {blocks.map((b, i) => (
          <div key={i} className="perf-sponsor-block">
            <Editable as="div" className="perf-sponsor-label" value={b.label} onChange={v => updateBlock(i, { label: v })} />
            <Editable as="div" className="perf-sponsor-name" value={b.name} onChange={v => updateBlock(i, { name: v })} />
            {b.statement !== undefined ? (
              <Editable as="p" linkify className="perf-sponsor-statement" value={b.statement} onChange={v => updateBlock(i, { statement: v })} multiline />
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
      {s.publicSupport ? (
        <Editable as="p" linkify className="perf-sponsor-public" value={s.publicSupport} onChange={v => update({ publicSupport: v })} multiline />
      ) : null}
      {s.closing ? (
        <Editable as="p" linkify className="perf-sponsor-closing" value={s.closing} onChange={v => update({ closing: v })} multiline />
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
          <Editable key={pi} as="p" linkify value={p} onChange={v => {
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
    plum:         "var(--vivo-plum)",
    tangerine:    "var(--vivo-tangerine)",
    orange:       "var(--vivo-orange)",
    blue:         "var(--vivo-blue)",
    "sky-blue":   "var(--vivo-sky-blue)",
    green:        "var(--vivo-green)",
    "light-green":"var(--vivo-light-green)",
    lavender:     "var(--vivo-lavender)",
    black:        "var(--vivo-black)",
    // legacy aliases from old data
    magenta:      "var(--vivo-plum)",
    azure:        "var(--vivo-blue)",
    violet:       "var(--vivo-plum)",
  };
  const bg = accentMap[accent] || "var(--vivo-plum)";
  // Light backgrounds need dark text
  const lightBg = accent === "light-green" || accent === "lavender" || accent === "cream";
  const bannerColor = lightBg ? "var(--vivo-black)" : "var(--vivo-cream)";
  const brushSrc = brush ? `assets/illustrations/${brush}-${brushColor || "cream"}.png` : null;
  return (
    <div className={"vivo-accordion " + (open ? "is-open" : "")}>
      <button
        className="vivo-banner"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`vivo-panel-${id}`}
        style={{ background: bg, color: bannerColor }}
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
                      {m.title ? <span className="vivo-staff-title">{m.title}</span> : null}
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
                  {(tier.donors || []).join(" · ")}
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
const SectionBody = ({ section, update, allSections, onGoSection, expandedBioId, onClearExpandedBio }) => {
  const biosSection = allSections?.find(s => s.kind === "bios");
  const onGoBio = (bioId) => {
    if (!biosSection) return;
    onGoSection?.(biosSection.id, { expandedBioId: bioId });
  };
  switch (section.kind) {
    case "welcome": return <WelcomeSection s={section} update={update} />;
    case "program": return <ProgramSection s={section} update={update} />;
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
    case "vivo": return <VivoSection s={section} update={update} />;
    default: return null;
  }
};

Object.assign(window, { SectionBody });
