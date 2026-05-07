// Vivo Program Book — Section page renderers
// Each section.kind gets a dedicated renderer

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

// ---- WELCOME ----
const WelcomeSection = ({ s, update }) => (
  <div className="welcome-page">
    <Editable as="div" className="welcome-quote" value={s.quote} onChange={v => update({ quote: v })} multiline />
    {s.body.map((p, i) => (
      <Editable key={i} as="p" linkify value={p} onChange={v => {
        if (!v.trim()) { update({ body: s.body.filter((_, j) => j !== i) }); return; }
        const body = [...s.body]; body[i] = v; update({ body });
      }} multiline />
    ))}
    <AddRowButton label="Add paragraph" onAdd={() => update({ body: [...s.body, "New paragraph…"] })} />
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
              if (!v.trim()) { update({ pieces: s.pieces.filter((_, j) => j !== i) }); return; }
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
                    if (!v.trim()) {
                      pieces[i] = { ...p, movements: p.movements.filter((_, j) => j !== mi) };
                    } else {
                      const movements = [...p.movements]; movements[mi] = v;
                      pieces[i] = { ...p, movements };
                    }
                    update({ pieces });
                  }} />
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
    <AddRowButton label="Add piece" onAdd={() => update({ pieces: [...s.pieces, { composer: "Composer", work: "Work Title" }] })} />
  </div>
);

// ---- SONG TEXT BLOCK ----

const SONG_TEXT_MODES = ['side-by-side', 'stacked', 'interlinear', 'facing-page', 'original-only', 'translation-only'];
const SONG_TEXT_LABELS = {
  'side-by-side':     'Side by side',
  'stacked':          'Stacked',
  'interlinear':      'Interlinear',
  'facing-page':      'Facing page',
  'original-only':    'Original',
  'translation-only': 'Translation',
};

function renderStanzaLines(text) {
  if (!text) return null;
  return text.split('\n').map((line, i, arr) => (
    React.createElement(React.Fragment, { key: i },
      line, i < arr.length - 1 ? React.createElement('br') : null
    )
  ));
}

const StbOrig = ({ st, lang }) => (
  <div className={'stb-orig' + (st.isChorus ? ' is-chorus' : '')} lang={lang}>
    {renderStanzaLines(st.original)}
  </div>
);

const StbTrans = ({ st, extraClass }) => st.translation ? (
  <div className={'stb-trans' + (extraClass ? ' ' + extraClass : '') + (st.isChorus ? ' is-chorus' : '')}>
    {renderStanzaLines(st.translation)}
  </div>
) : null;

const StbSpeaker = ({ st }) => st.speaker ? <div className="stb-speaker">{st.speaker}</div> : null;

const SongTextBlock = ({ block, sectionId }) => {
  const storageKey = 'vivo-song-text:' + (sectionId || block.displayMode || '?');
  const [mode, setModeRaw] = useStateS(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v && SONG_TEXT_MODES.includes(v)) return v;
    } catch(e) {}
    return block.displayMode || 'original-only';
  });

  const setMode = (m) => {
    setModeRaw(m);
    try { localStorage.setItem(storageKey, m); } catch(e) {}
  };

  const stanzas = block.stanzas || [];
  const lang = block.originalLanguage || undefined;
  const hasTranslation = stanzas.some(st => st.translation);
  const modes = hasTranslation ? SONG_TEXT_MODES : ['original-only'];

  let body;
  switch (mode) {
    case 'side-by-side':
      body = (
        <div className="stb-sbs">
          {stanzas.map((st, i) => (
            <div key={i} className="stb-sbs-pair">
              <StbSpeaker st={st} />
              <div className="stb-sbs-cols">
                <StbOrig st={st} lang={lang} />
                <StbTrans st={st} />
              </div>
            </div>
          ))}
        </div>
      );
      break;
    case 'stacked':
      body = (
        <div className="stb-stacked">
          {stanzas.map((st, i) => (
            <div key={i} className="stb-stacked-pair">
              <StbSpeaker st={st} />
              <StbOrig st={st} lang={lang} />
              <StbTrans st={st} extraClass="stb-trans--indent" />
            </div>
          ))}
        </div>
      );
      break;
    case 'interlinear':
      body = (
        <div className="stb-interlinear">
          {stanzas.map((st, i) => {
            const ol = (st.original || '').split('\n');
            const tl = (st.translation || '').split('\n');
            return (
              <div key={i} className={'stb-il-stanza' + (st.isChorus ? ' is-chorus' : '')}>
                <StbSpeaker st={st} />
                {ol.map((line, j) => (
                  <React.Fragment key={j}>
                    <div className="stb-il-orig" lang={lang}>{line}</div>
                    {tl[j] ? <div className="stb-il-trans">{tl[j]}</div> : null}
                  </React.Fragment>
                ))}
              </div>
            );
          })}
        </div>
      );
      break;
    case 'facing-page':
      body = (
        <div className="stb-fp">
          <div className="stb-fp-col">
            {stanzas.map((st, i) => (
              <div key={i} className={'stb-stanza' + (st.isChorus ? ' is-chorus' : '')}>
                <StbSpeaker st={st} />
                <StbOrig st={st} lang={lang} />
              </div>
            ))}
          </div>
          <div className="stb-fp-col stb-fp-trans-col">
            {stanzas.map((st, i) => (
              <div key={i} className={'stb-stanza' + (st.isChorus ? ' is-chorus' : '')}>
                <StbSpeaker st={st} />
                <StbTrans st={st} />
              </div>
            ))}
          </div>
        </div>
      );
      break;
    case 'original-only':
      body = (
        <div className="stb-single">
          {stanzas.map((st, i) => (
            <div key={i} className={'stb-stanza' + (st.isChorus ? ' is-chorus' : '')}>
              <StbSpeaker st={st} />
              <StbOrig st={st} lang={lang} />
            </div>
          ))}
        </div>
      );
      break;
    case 'translation-only':
      body = (
        <div className="stb-single">
          {stanzas.map((st, i) => (
            <div key={i} className={'stb-stanza' + (st.isChorus ? ' is-chorus' : '')}>
              <StbSpeaker st={st} />
              <StbTrans st={st} />
            </div>
          ))}
        </div>
      );
      break;
    default:
      body = null;
  }

  return (
    <div className="song-text-block">
      {modes.length > 1 && (
        <div className="stb-toolbar" role="group" aria-label="Text display mode">
          {modes.map(m => (
            <button
              key={m}
              className={'stb-mode-btn' + (m === mode ? ' is-active' : '')}
              onClick={() => setMode(m)}
              aria-pressed={m === mode}
            >
              {SONG_TEXT_LABELS[m]}
            </button>
          ))}
        </div>
      )}
      {body}
      {block.translator && (
        <p className="stb-translator">Translation by {block.translator}</p>
      )}
    </div>
  );
};

// ---- NOTES (long-form) ----
const NotesSection = ({ s, update }) => {
  const editing = window.__editMode;
  const updSec = (i, patch) => {
    const sections = [...s.sections]; sections[i] = { ...sections[i], ...patch }; update({ sections });
  };
  return (
    <div>
      {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
      {s.sections.map((sec, i) => (
        <div key={i} className="notes-entry">
          <Editable as="h3" value={sec.h} onChange={v => {
            if (!v.trim()) { update({ sections: s.sections.filter((_, j) => j !== i) }); return; }
            updSec(i, { h: v });
          }} />
          {(editing || sec.subhead) && (
            <Editable as="p" className="notes-subhead" value={sec.subhead || ''} onChange={v => updSec(i, { subhead: v })} />
          )}
          {(sec.body || []).map((p, pi) => (
            <Editable key={pi} as="p" linkify value={p} onChange={v => {
              const body = [...(sec.body || [])];
              if (!v.trim()) { body.splice(pi, 1); } else { body[pi] = v; }
              updSec(i, { body });
            }} multiline />
          ))}
          {sec.songText && <SongTextBlock block={sec.songText} sectionId={sec.h} />}
          <AddRowButton label="Add paragraph" onAdd={() => updSec(i, { body: [...(sec.body || []), "New paragraph…"] })} />
          {sec.subSections && sec.subSections.map((sub, si) => (
            <div key={si} className="notes-sub-section">
              {editing ? (
                <Editable as="h4" className="notes-sub-h" value={sub.h || ''} onChange={v => {
                  const subSections = [...sec.subSections]; subSections[si] = { ...sub, h: v }; updSec(i, { subSections });
                }} />
              ) : (
                sub.h && <h4 className="notes-sub-h">{sub.h}</h4>
              )}
              {(sub.parts || []).map((part, pi) => (
                <div key={pi} className="notes-sub-part">
                  {editing ? (
                    <Editable as="h5" className="notes-sub-part-h" value={part.h || ''} onChange={v => {
                      const subSections = [...sec.subSections];
                      const parts = [...(sub.parts || [])]; parts[pi] = { ...part, h: v };
                      subSections[si] = { ...sub, parts }; updSec(i, { subSections });
                    }} />
                  ) : (
                    part.h && <h5 className="notes-sub-part-h">{part.h}</h5>
                  )}
                  {(part.body || []).map((p, bi) => editing ? (
                    <Editable key={bi} as="p" className="notes-sub-part-body" value={p} onChange={v => {
                      const subSections = [...sec.subSections];
                      const parts = [...(sub.parts || [])];
                      const body = [...(part.body || [])];
                      if (!v.trim()) { body.splice(bi, 1); } else { body[bi] = v; }
                      parts[pi] = { ...part, body };
                      subSections[si] = { ...sub, parts }; updSec(i, { subSections });
                    }} multiline />
                  ) : (
                    <p key={bi} className="notes-sub-part-body">{p}</p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      <AddRowButton label="Add section" onAdd={() => update({ sections: [...s.sections, { h: "New Section", body: ["Text here…"] }] })} />
      {(editing || (s.callout && s.callout.body && s.callout.body.length > 0)) && (
        <div className="notes-callout">
          {(editing || s.callout?.label) && (
            <Editable as="div" className="notes-callout-label" value={s.callout?.label || ''} onChange={v => update({ callout: { ...s.callout, label: v } })} />
          )}
          {(s.callout?.body || []).map((p, i) => (
            <Editable key={i} as="p" className="notes-callout-body" value={p} onChange={v => {
              const body = [...(s.callout?.body || [])];
              if (!v.trim()) { body.splice(i, 1); } else { body[i] = v; }
              update({ callout: { ...s.callout, body } });
            }} multiline />
          ))}
          {editing && <AddRowButton label="Add callout paragraph" onAdd={() => update({ callout: { ...s.callout, body: [...(s.callout?.body || []), 'New text…'] } })} />}
        </div>
      )}
      {(editing || s.closing) && (
        <Editable as="p" className="notes-closing" value={s.closing || ''} onChange={v => update({ closing: v })} multiline />
      )}
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
          if (!v.trim()) { update({ sections: s.sections.filter((_, j) => j !== i) }); return; }
          const sections = [...s.sections]; sections[i] = { ...sec, h: v }; update({ sections });
        }} />
        {sec.body.map((p, pi) => (
          <Editable key={pi} as="p" linkify value={p} onChange={v => {
            const sections = [...s.sections];
            if (!v.trim()) {
              sections[i] = { ...sec, body: sec.body.filter((_, j) => j !== pi) };
            } else {
              const body = [...sec.body]; body[pi] = v;
              sections[i] = { ...sec, body };
            }
            update({ sections });
          }} multiline />
        ))}
        <AddRowButton label="Add paragraph" onAdd={() => {
          const sections = [...s.sections];
          sections[i] = { ...sec, body: [...sec.body, "New paragraph…"] };
          update({ sections });
        }} />
      </div>
    ))}
    <AddRowButton label="Add section" onAdd={() => update({ sections: [...s.sections, { h: "New Section", body: ["Text here…"] }] })} />
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

// View-mode company layout: all cast share one role (e.g. "Company Member")
const CastCompanyView = ({ s }) => {
  const roleLabel = s.cast[0]?.role || 'Company Members';
  return (
    <div className="cast-company">
      <div className="cast-company-eyebrow">{roleLabel}s</div>
      <div className="cast-company-grid">
        {s.cast.map((c, i) => (
          <div key={i} className="cast-company-name">{c.name}</div>
        ))}
      </div>
      {(s.creative || []).length > 0 && (
        <ul className="cast-creative-list">
          {s.creative.map((c, i) => (
            <li key={i} className="cast-creative-row">
              <span className="cast-creative-name">{c.name}</span>
              <span className="cast-creative-role">{c.role}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CastSection = ({ s, update, bios, onGoBio }) => {
  const cast = s.cast || [];
  const isCompanyLayout = !window.__editMode
    && cast.length > 6
    && new Set(cast.map(c => c.role)).size === 1;

  if (isCompanyLayout) return <CastCompanyView s={s} />;

  return (
    <div>
      <Editable as="h3" className="cast-section-h" value={s.castLabel || "Cast"} onChange={v => update({ castLabel: v })} />
      <ul className="cast-list">
        {cast.map((c, i) => (
          <CastRow key={i} c={c} i={i} list={cast} listKey="cast" update={update} bios={bios} onGoBio={onGoBio} />
        ))}
      </ul>
      <AddRowButton label="Add performer" onAdd={() => update({ cast: [...cast, { role: "Role", name: "Name" }] })} />
      <Editable as="h3" className="cast-section-h is-second" value={s.creativeLabel || "Creative & Production"} onChange={v => update({ creativeLabel: v })} />
      <ul className="cast-list">
        {(s.creative || []).map((c, i) => (
          <CastRow key={i} c={c} i={i} list={s.creative} listKey="creative" update={update} bios={bios} onGoBio={onGoBio} />
        ))}
      </ul>
      <AddRowButton label="Add credit" onAdd={() => update({ creative: [...(s.creative || []), { role: "Role", name: "Name" }] })} />
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
                if (!v.trim()) {
                  groups[i] = { ...g, players: g.players.filter((_, j) => j !== pi) };
                } else {
                  const players = [...g.players]; players[pi] = v;
                  groups[i] = { ...g, players };
                }
                update({ groups });
              }} />
            </li>
          ))}
        </ul>
        <AddRowButton label="Add player" onAdd={() => {
          const groups = [...s.groups];
          groups[i] = { ...g, players: [...g.players, "New Name"] };
          update({ groups });
        }} />
      </div>
    ))}
    {s.footer ? <p className="roster-footer">{s.footer}</p> : null}
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
                      if (!v.trim()) {
                        bios[i] = { ...b, body: b.body.filter((_, j) => j !== pi) };
                      } else {
                        const body = [...b.body]; body[pi] = v;
                        bios[i] = { ...b, body };
                      }
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
                if (!v.trim()) {
                  tiers[i] = { ...t, names: t.names.filter((_, j) => j !== ni) };
                } else {
                  const names = [...t.names]; names[ni] = v;
                  tiers[i] = { ...t, names };
                }
                update({ tiers });
              }} />
            </li>
          ))}
        </ul>
        <AddRowButton label="Add name" onAdd={() => {
          const tiers = [...s.tiers];
          tiers[i] = { ...t, names: [...t.names, "New Donor"] };
          update({ tiers });
        }} />
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
              if (!v.trim()) { update({ events: s.events.filter((_, j) => j !== i) }); return; }
              const events = [...s.events]; events[i] = { ...e, title: v }; update({ events });
            }} />
            <Editable as="div" className="meta" value={e.meta} onChange={v => {
              const events = [...s.events]; events[i] = { ...e, meta: v }; update({ events });
            }} multiline />
          </div>
        </li>
      ))}
    </ul>
    <AddRowButton label="Add event" onAdd={() => update({ events: [...s.events, { month: "Month", day: "1", title: "Event Title", meta: "Time · Venue" }] })} />
  </div>
);

// ---- PERFORMANCE SPONSOR ----
const PerformanceSponsorSection = ({ s, update }) => {
  const editing = window.__editMode;
  const blocks = s.blocks || [];
  const updateBlock = (i, patch) => {
    const next = blocks.map((b, j) => j === i ? { ...b, ...patch } : b);
    update({ blocks: next });
  };
  const addBlock = () => {
    update({ blocks: [...blocks, { label: "Presented by", name: "", statement: "", photo: "" }] });
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
            {editing && (
              <div className="perf-sponsor-block-bar">
                <span className="perf-sponsor-block-num">Block {i + 1}</span>
                <button className="perf-sponsor-delete-btn" onClick={() => removeBlock(i)}>
                  <Icon name="x" size={13} /> Delete block
                </button>
              </div>
            )}
            {/* Photo — shown in view mode if set, always shown in edit mode */}
            {(editing || b.photo) && (
              <div className="perf-sponsor-photo-wrap">
                <PhotoSlot
                  src={b.photo || ""}
                  alt={b.name || ""}
                  className="perf-sponsor-photo"
                  size={80}
                  onChange={src => updateBlock(i, { photo: src })}
                  onClear={() => updateBlock(i, { photo: "" })}
                />
              </div>
            )}
            <Editable as="div" className="perf-sponsor-label" value={b.label || ""} onChange={v => updateBlock(i, { label: v })} placeholder="Label (e.g. Presented by)" />
            <Editable as="div" className="perf-sponsor-name" value={b.name || ""} onChange={v => updateBlock(i, { name: v })} placeholder="Name or title" />
            {(editing || b.statement) && (
              <Editable as="p" linkify className="perf-sponsor-statement" value={b.statement || ""} onChange={v => updateBlock(i, { statement: v })} multiline placeholder="Supporting statement or body copy…" />
            )}
          </div>
        ))}
        {editing && (
          <button className="perf-sponsor-add" onClick={addBlock}>+ Add block</button>
        )}
      </div>
      {(editing || s.seasonSponsors) && (
        <div className="perf-sponsor-season">
          <Editable as="div" className="perf-sponsor-label" value={s.seasonSponsorsLabel || "Season Sponsors"} onChange={v => update({ seasonSponsorsLabel: v })} />
          <Editable as="div" className="perf-sponsor-name" value={s.seasonSponsors || ""} onChange={v => update({ seasonSponsors: v })} multiline />
        </div>
      )}
      {(editing || s.publicSupport) && (
        <Editable as="p" linkify className="perf-sponsor-public" value={s.publicSupport || ""} onChange={v => update({ publicSupport: v })} multiline />
      )}
      {(editing || s.closing) && (
        <Editable as="p" linkify className="perf-sponsor-closing" value={s.closing || ""} onChange={v => update({ closing: v })} multiline />
      )}
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
          if (!v.trim()) { update({ sections: s.sections.filter((_, j) => j !== i) }); return; }
          const sections = [...s.sections]; sections[i] = { ...sec, h: v }; update({ sections });
        }} />
        {sec.body.map((p, pi) => (
          <Editable key={pi} as="p" linkify value={p} onChange={v => {
            const sections = [...s.sections];
            if (!v.trim()) {
              sections[i] = { ...sec, body: sec.body.filter((_, j) => j !== pi) };
            } else {
              const body = [...sec.body]; body[pi] = v;
              sections[i] = { ...sec, body };
            }
            update({ sections });
          }} multiline />
        ))}
        <AddRowButton label="Add paragraph" onAdd={() => {
          const sections = [...s.sections];
          sections[i] = { ...sec, body: [...sec.body, "New paragraph…"] };
          update({ sections });
        }} />
      </div>
    ))}
    <AddRowButton label="Add section" onAdd={() => update({ sections: [...s.sections, { h: "New Section", body: ["Text here…"] }] })} />
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

// ---- CUSTOM HTML ----
const HtmlSection = ({ s, update }) => {
  const editing = window.__editMode;
  const fileRef = useRefS(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ content: ev.target.result || "" });
    reader.readAsText(file);
    e.target.value = "";
  };

  if (editing) {
    return (
      <div className="html-section-edit">
        <textarea
          className="html-section-textarea"
          value={s.content || ""}
          onChange={e => update({ content: e.target.value })}
          placeholder={"Paste HTML here, or upload a file below…\n\nExamples:\n<p>Paragraph text</p>\n<a href=\"https://...\">Link</a>\n<table>...</table>"}
          rows={12}
          spellCheck={false}
        />
        <div className="html-section-actions">
          <input ref={fileRef} type="file" accept=".html,.htm,.txt" style={{ display: "none" }} onChange={handleFile} />
          <button className="html-section-upload-btn" onClick={() => fileRef.current?.click()}>
            Upload HTML file (.html / .htm)
          </button>
          <span className="html-section-hint">Paste any HTML — paragraphs, tables, formatted text, embeds. Renders exactly as written in view mode.</span>
        </div>
      </div>
    );
  }

  if (!s.content) return null;
  return <div className="html-section-view" dangerouslySetInnerHTML={{ __html: s.content }} />;
};

// ---- PROGRAM TABULAR (orchestra / classical / voice) ----

function renderMovement(text) {
  // "Title (Tempo marking)" — italicise the non-tempo title
  const parenMatch = text.match(/^(.+?)\s*(\(.+\))$/);
  if (parenMatch) {
    return React.createElement(React.Fragment, null,
      React.createElement('em', null, parenMatch[1].trim()), ' ', parenMatch[2]);
  }
  // "Title. Tempo" — period-separated (Scherzo. Presto, Blues. Moderato, etc.)
  const periodMatch = text.match(/^([^.]+)\.\s+(.+)$/);
  if (periodMatch) {
    return React.createElement(React.Fragment, null,
      React.createElement('em', null, periodMatch[1] + '.'), ' ', periodMatch[2]);
  }
  return text;
}

const SubItem = ({ sub }) => (
  <div className="pt-subitem">
    <div className="pt-subitem-work">{sub.work}</div>
    {sub.composer && <div className="pt-subitem-composer">{sub.composer}</div>}
  </div>
);

const PieceRow = ({ piece, onUpdate, onRemove }) => {
  const editing = window.__editMode;
  return (
    <div className="pt-row">
      {editing ? (
        <Editable as="div" className="pt-composer" value={piece.composer || ''} onChange={v => {
          if (!v.trim()) { onRemove?.(); return; }
          onUpdate?.({ composer: v });
        }} />
      ) : (
        <div className="pt-composer">{piece.composer}</div>
      )}
      <div className="pt-work-block">
        {editing ? (
          <Editable as="div" className="pt-work" value={piece.work || ''} onChange={v => onUpdate?.({ work: v })} multiline />
        ) : (
          <div className="pt-work">{piece.work}</div>
        )}
        {((piece.movements && piece.movements.length > 0) || editing) && (
          <div className="pt-movements">
            {(piece.movements || []).map((m, mi) => editing ? (
              <Editable key={mi} as="div" className="pt-mvt" value={m} onChange={v => {
                const movements = [...(piece.movements || [])];
                if (!v.trim()) { movements.splice(mi, 1); } else { movements[mi] = v; }
                onUpdate?.({ movements });
              }} />
            ) : (
              <div key={mi} className="pt-mvt">{renderMovement(m)}</div>
            ))}
            {editing && <AddRowButton label="Add movement" onAdd={() => onUpdate?.({ movements: [...(piece.movements || []), 'New Movement'] })} />}
          </div>
        )}
        {piece.subItems && piece.subItems.length > 0 && (
          <div className="pt-subitems">
            {piece.subItems.map((sub, i) => <SubItem key={i} sub={sub} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const PieceGroup = ({ group, onUpdate }) => {
  const editing = window.__editMode;
  const items = group.items || [];
  const updateItem = (i, patch) => {
    const next = [...items]; next[i] = { ...next[i], ...patch }; onUpdate?.({ items: next });
  };
  const removeItem = (i) => onUpdate?.({ items: items.filter((_, j) => j !== i) });
  return (
    <div className="pt-group">
      {editing ? (
        <Editable as="div" className="pt-group-header" value={group.title || ''} onChange={v => onUpdate?.({ title: v })} />
      ) : (
        <div className="pt-group-header">{group.title}</div>
      )}
      {items.map((item, i) => (
        <PieceRow key={i} piece={item} onUpdate={p => updateItem(i, p)} onRemove={() => removeItem(i)} />
      ))}
      {editing && <AddRowButton label="Add item" onAdd={() => onUpdate?.({ items: [...items, { composer: 'Composer', work: 'Work Title' }] })} />}
    </div>
  );
};

const ProgramTabular = ({ s, update }) => {
  const editing = window.__editMode;
  const pieces = s.pieces || [];
  const updatePiece = (i, patch) => {
    const next = [...pieces]; next[i] = { ...next[i], ...patch }; update?.({ pieces: next });
  };
  const removePiece = (i) => update?.({ pieces: pieces.filter((_, j) => j !== i) });
  return (
    <div className="program-tabular">
      {editing ? (
        <Editable as="p" className="pt-lead" value={s.lead || ''} onChange={v => update?.({ lead: v })} multiline />
      ) : (
        s.lead && <p className="pt-lead">{s.lead}</p>
      )}
      <div className="pt-body">
        {pieces.map((piece, i) => {
          if (piece.kind === 'intermission') {
            return (
              <div key={i} className="pt-intermission">
                {editing ? (
                  <Editable as="span" value={piece.label || 'INTERMISSION'} onChange={v => updatePiece(i, { label: v })} />
                ) : (
                  <span>{piece.label || 'INTERMISSION'}</span>
                )}
              </div>
            );
          }
          if (piece.isGroup) return <PieceGroup key={i} group={piece} onUpdate={p => updatePiece(i, p)} />;
          return <PieceRow key={i} piece={piece} onUpdate={p => updatePiece(i, p)} onRemove={() => removePiece(i)} />;
        })}
      </div>
      {editing && <AddRowButton label="Add piece" onAdd={() => update?.({ pieces: [...pieces, { composer: 'Composer', work: 'Work Title' }] })} />}
    </div>
  );
};

// ---- PROGRAM CENTERED (dance layout) ----

function parseDescParagraph(text) {
  // Attribution on a new line: "text\n— Attribution"
  const nlMatch = text.match(/^([\s\S]+?)\n—\s+(.+)$/);
  if (nlMatch) return { quote: nlMatch[1].trim(), attribution: nlMatch[2].trim() };
  // Inline attribution at end: closing quote + " — Name" (spaced em-dash)
  const lastEM = text.lastIndexOf(' — ');
  if (lastEM > 0) {
    const after = text.slice(lastEM + 3).trim();
    if (!after.includes('\n') && after.length <= 80) {
      return { quote: text.slice(0, lastEM).trim(), attribution: after };
    }
  }
  return { quote: text, attribution: null };
}

const PieceCentered = ({ piece, onUpdate, onRemove }) => {
  const editing = window.__editMode;
  const descParagraphs = piece.description
    ? piece.description.split('\n\n').filter(Boolean)
    : [];
  const credits = piece.credits || [];
  const updateCredit = (ci, patch) => {
    const next = [...credits]; next[ci] = { ...next[ci], ...patch };
    onUpdate?.({ credits: next });
  };
  const removeCredit = (ci) => onUpdate?.({ credits: credits.filter((_, j) => j !== ci) });

  return (
    <div className="pc-piece">
      {editing ? (
        <Editable as="div" className="pc-piece-title" value={piece.title || ''} onChange={v => {
          if (!v.trim()) { onRemove?.(); return; }
          onUpdate?.({ title: v });
        }} />
      ) : (
        <div className="pc-piece-title">{piece.title}</div>
      )}
      {editing ? (
        <Editable as="div" className="pc-piece-year" value={piece.year || ''} onChange={v => onUpdate?.({ year: v })} placeholder="Year" />
      ) : (
        piece.year && <div className="pc-piece-year">({piece.year})</div>
      )}
      {editing ? (
        <Editable as="div" className="pc-piece-meta" value={piece.meta || ''} onChange={v => onUpdate?.({ meta: v })} multiline />
      ) : (
        piece.meta && <div className="pc-piece-meta">{piece.meta}</div>
      )}

      {(credits.length > 0 || editing) && (
        <div className="pc-credits">
          {credits.map((c, ci) => (
            <div key={ci} className="pc-credit-line">
              {editing ? (
                <>
                  <Editable as="span" className="pc-credit-role" value={c.role || ''} onChange={v => updateCredit(ci, { role: v })} />
                  {' '}
                  <Editable as="span" className="pc-credit-name" value={c.name || ''} onChange={v => {
                    if (!v.trim()) { removeCredit(ci); return; }
                    updateCredit(ci, { name: v });
                  }} />
                </>
              ) : (
                <>
                  <span className="pc-credit-role">{c.role}</span>{' '}
                  <span className="pc-credit-name">{c.name}</span>
                </>
              )}
            </div>
          ))}
          {editing && <AddRowButton label="Add credit" onAdd={() => onUpdate?.({ credits: [...credits, { role: 'Role', name: 'Name' }] })} />}
        </div>
      )}

      {(descParagraphs.length > 0 || editing) && (
        <div className="pc-description">
          {editing ? (
            <Editable as="div" className="pc-quote-text" value={piece.description || ''} onChange={v => onUpdate?.({ description: v })} multiline />
          ) : (
            descParagraphs.map((para, i) => {
              const { quote, attribution } = parseDescParagraph(para);
              return (
                <div key={i} className="pc-quote-block">
                  <p className="pc-quote-text">{quote}</p>
                  {attribution && <p className="pc-quote-attr">— {attribution}</p>}
                </div>
              );
            })
          )}
        </div>
      )}

      {editing ? (
        <Editable as="p" className="pc-note" value={piece.note || ''} onChange={v => onUpdate?.({ note: v })} multiline />
      ) : (
        piece.note && <p className="pc-note">{piece.note}</p>
      )}

      {piece.sections && piece.sections.length > 0 && (
        <div className="pc-subsections">
          {piece.sections.map((sec, si) => (
            <div key={si} className="pc-subsection">
              <div className="pc-subsection-h">{sec.h}</div>
              {sec.items && sec.items.map((item, ii) => (
                <div key={ii} className="pc-subsection-item">
                  <span className="pc-subsection-item-title">{item.title}</span>
                  {item.meta && <span className="pc-subsection-item-meta">{item.meta}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <Editable as="p" className="pc-music-credits" value={piece.musicCredits || ''} onChange={v => onUpdate?.({ musicCredits: v })} multiline />
      ) : (
        piece.musicCredits && (
          <p className="pc-music-credits">
            {piece.musicCredits.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
            ))}
          </p>
        )
      )}
    </div>
  );
};

const ProgramCentered = ({ s, update }) => {
  const editing = window.__editMode;
  const pieces = s.pieces || [];
  const updatePiece = (i, patch) => {
    const next = [...pieces]; next[i] = { ...next[i], ...patch }; update?.({ pieces: next });
  };
  const removePiece = (i) => update?.({ pieces: pieces.filter((_, j) => j !== i) });
  const leadLines = s.lead ? s.lead.split('\n') : [];

  return (
    <div className="program-centered">
      {editing ? (
        <div className="pc-info-block">
          <Editable as="p" className="pc-info-line" value={s.lead || ''} onChange={v => update?.({ lead: v })} multiline />
        </div>
      ) : (
        leadLines.length > 0 && (
          <div className="pc-info-block">
            {leadLines.map((line, i) => (
              <p key={i} className={i === 0 ? 'pc-info-line pc-info-dates' : 'pc-info-line'}>{line}</p>
            ))}
          </div>
        )
      )}
      <div className="pc-pieces">
        {pieces.map((piece, i) => {
          if (piece.kind === 'intermission') {
            return (
              <div key={i} className="pc-intermission">
                {editing ? (
                  <Editable as="span" value={piece.label || 'INTERMISSION'} onChange={v => updatePiece(i, { label: v })} />
                ) : (
                  <span>{piece.label || 'INTERMISSION'}</span>
                )}
              </div>
            );
          }
          return <PieceCentered key={i} piece={piece} onUpdate={p => updatePiece(i, p)} onRemove={() => removePiece(i)} />;
        })}
      </div>
      {editing && <AddRowButton label="Add piece" onAdd={() => update?.({ pieces: [...pieces, { title: 'New Work', year: '', credits: [], description: '' }] })} />}
    </div>
  );
};

// ---- Program display-style resolver ----
// "tabular"  → explicit displayStyle:"tabular" (orchestra, classical, voice)
// "centered" → explicit displayStyle:"centered" OR no displayStyle + dance schema
//              Dance schema is detected by pieces having {title} not {composer}
// null       → fall through to legacy ProgramSection (old edit-mode schema)
function resolveProgramStyle(section) {
  const ds = section.displayStyle;
  if (ds === 'tabular') return 'tabular';
  if (ds === 'centered') return 'centered';
  // Infer centered from schema shape: dance pieces use {title}, not {composer}
  if (!ds) {
    const firstPiece = section.pieces?.find(p => p.kind !== 'intermission');
    if (firstPiece?.title && !firstPiece?.composer) return 'centered';
  }
  return null;
}

// ---- Main switcher ----
const SectionBody = ({ section, update, allSections, onGoSection, expandedBioId, onClearExpandedBio }) => {
  const biosSection = allSections?.find(s => s.kind === "bios");
  const onGoBio = (bioId) => {
    if (!biosSection) return;
    onGoSection?.(biosSection.id, { expandedBioId: bioId });
  };
  switch (section.kind) {
    case "welcome": return <WelcomeSection s={section} update={update} />;
    case "program": {
      const style = resolveProgramStyle(section);
      if (style === 'tabular')  return <ProgramTabular s={section} update={update} />;
      if (style === 'centered') return <ProgramCentered s={section} update={update} />;
      return <ProgramSection s={section} update={update} />;
    }
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
    case "html": return <HtmlSection s={section} update={update} />;
    case "vivo": return <VivoSection s={section} update={update} />;
    default: return null;
  }
};

Object.assign(window, { SectionBody });
