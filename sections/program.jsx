import React from 'react';
import { Editable, PlainField, SectionBottomNav } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';

// Parses legacy rawProgram strings stored in Blobs; keeps existing data readable.
const parseProgram = (text) => {
  const out = [];
  String(text || "").replace(/\r/g, "").split(/\n\s*\n/).forEach(block => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    lines.forEach((ln, i) => {
      if (/^intermission$/i.test(ln)) { out.push({ kind: "intermission" }); return; }
      const cur = out.length ? out[out.length - 1] : null;
      if (i === 0 || !cur || cur.kind === "intermission") {
        const noComposerM = ln.match(/^[—–]\s+(.+)$/);
        if (noComposerM) { out.push({ composer: "", work: noComposerM[1].trim(), movements: [] }); return; }
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

const PROGRAM_STANDARD = {
  seasonSponsorsLabel: "Season Sponsors",
  massCultural: "Vivo Performing Arts is supported in part by the Mass Cultural Council, a state agency."
};

const ProgramSection = ({ s, update, allSections, onGoSection, cover }) => {
  const editing = useEditMode();
  const pieces = s.pieces || (s.rawProgram ? parseProgram(s.rawProgram) : []);
  const centered = s.programStyle === "dance" || s.programStyle === "centered";

  const sp = s.sponsor || {};
  const setSp = (patch) => update({ sponsor: { ...sp, ...patch } });
  const mgmt = (sp.mgmtCredits && sp.mgmtCredits.length ? sp.mgmtCredits : (sp.arrangements || [])).filter(x => x != null);
  const setMgmt = (list) => setSp({ mgmtCredits: list, arrangements: undefined });
  const seasonLabel = sp.seasonSponsorsLabel || sp.label || PROGRAM_STANDARD.seasonSponsorsLabel;
  const seasonNames = sp.seasonSponsors != null ? sp.seasonSponsors : (sp.name || "");
  const massLine = sp.closing != null && sp.closing !== "" ? sp.closing : PROGRAM_STANDARD.massCultural;

  const setPieces = (arr) => update({ pieces: arr });
  const updatePiece = (i, patch) => setPieces(pieces.map((p, j) => j === i ? { ...p, ...patch } : p));
  const removePiece = (i) => { setPieces(pieces.filter((_, j) => j !== i)); window.__vivoToast && window.__vivoToast("Removed · ⌘Z to undo"); };
  const movePiece = (i, dir) => {
    const arr = [...pieces]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setPieces(arr);
  };
  const spliceIn = (idx, item) => { const arr = [...pieces]; arr.splice(idx, 0, item); setPieces(arr); };
  const updateMovement = (pi, mi, val) => {
    const arr = [...pieces]; const mvts = [...(arr[pi].movements || [])]; mvts[mi] = val;
    arr[pi] = { ...arr[pi], movements: mvts }; setPieces(arr);
  };
  const removeMovement = (pi, mi) => {
    const arr = [...pieces];
    arr[pi] = { ...arr[pi], movements: (arr[pi].movements || []).filter((_, j) => j !== mi) }; setPieces(arr);
  };
  const addMovement = (pi) => {
    const arr = [...pieces];
    arr[pi] = { ...arr[pi], movements: [...(arr[pi].movements || []), ""] }; setPieces(arr);
  };

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
            <div className="program-perf-meta">{[gt("date"), gt("time"), gt("venue")].filter(Boolean).join("   ")}</div>
          </div>
        );
      })() : null}

      {(s.subtitle || editing) ? (
        <Editable as="p" className="section-subtitle" value={s.subtitle || ""} onChange={v => update({ subtitle: v })} multiline />
      ) : null}

      {/* WYSIWYG program list — edit and read share the same layout */}
      <ol className={"program-list" + (centered ? " is-centered" : "")}>
        {pieces.map((p, i) => {
          if (p.kind === "intermission") {
            return (
              <li key={i} className="program-divider">
                Intermission
                {editing && (
                  <button className="prog-item-rm" contentEditable={false} onClick={() => removePiece(i)} title="Remove">✕</button>
                )}
              </li>
            );
          }
          const noteHref = p.noteId ? "#/" + p.noteId : null;
          return (
            <li key={i} className="program-item">
              {editing && (
                <div className="prog-item-ctrls" contentEditable={false}>
                  <button onClick={() => movePiece(i, -1)} disabled={i === 0} title="Move up">↑</button>
                  <button onClick={() => movePiece(i, 1)} disabled={i === pieces.length - 1} title="Move down">↓</button>
                  <button className="prog-item-rm" onClick={() => removePiece(i)} title="Remove piece">✕</button>
                </div>
              )}
              <Editable as="div" className="composer" value={p.composer || ""} data-placeholder="Composer" onChange={v => updatePiece(i, { composer: v })} rich={false} />
              {noteHref && !editing ? (
                <a className="work work-link" href={noteHref} onClick={(e) => { e.preventDefault(); onGoSection && onGoSection(p.noteId); }}>{p.work}</a>
              ) : (
                <Editable as="div" className="work" value={p.work || ""} data-placeholder="Work title" onChange={v => updatePiece(i, { work: v })} rich={false} />
              )}
              {(p.meta || editing) ? (
                <Editable as="div" className="meta" value={p.meta || ""} data-placeholder="(credit, optional)" onChange={v => updatePiece(i, { meta: v })} rich={false} />
              ) : null}
              {((p.movements || []).length > 0 || editing) ? (
                <div className="movements">
                  {(p.movements || []).map((m, mi) => (
                    editing ? (
                      <div key={mi} className="prog-mvt-row">
                        <Editable as="span" className="mvt" value={m || ""} data-placeholder="Movement title" onChange={v => updateMovement(i, mi, v)} rich={false} />
                        <button className="prog-mvt-rm" contentEditable={false} onClick={() => removeMovement(i, mi)} title="Remove movement">✕</button>
                      </div>
                    ) : (
                      <span key={mi} className="mvt">{m}</span>
                    )
                  ))}
                  {editing && (
                    <button className="prog-mvt-add" contentEditable={false} onClick={() => addMovement(i)}>+ movement</button>
                  )}
                </div>
              ) : null}
              {editing && (
                <div className="prog-insert-row" contentEditable={false}>
                  <button onClick={() => spliceIn(i + 1, { composer: "", work: "", movements: [] })}>+ piece</button>
                  <button onClick={() => spliceIn(i + 1, { kind: "intermission" })}>+ intermission</button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {editing && (
        <div className="prog-append-row">
          {pieces.length === 0 && <p className="prog-empty-hint">No pieces yet — add the first one</p>}
          <button onClick={() => spliceIn(pieces.length, { composer: "", work: "", movements: [] })}>+ piece</button>
          <button onClick={() => spliceIn(pieces.length, { kind: "intermission" })}>+ intermission</button>
        </div>
      )}

      {editing ? (
        <PlainField className="prog-runtime-field" label="Run time note" value={s.runtimeNote || ""} placeholder="Approximately 1 hour 50 minutes, including intermission" onChange={v => update({ runtimeNote: v })} multiline />
      ) : (s.runtimeNote ? <p className="program-runtime" dangerouslySetInnerHTML={{ __html: s.runtimeNote }} /> : null)}

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

export { ProgramSection };
