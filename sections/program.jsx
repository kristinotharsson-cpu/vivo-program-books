import React from 'react';
import { Editable, PlainField } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';
import { ProgramEditor, piecesToHtml } from '../program-editor.jsx';

const PROGRAM_STANDARD = {
  seasonSponsorsLabel: "Season Sponsors",
  massCultural: "Vivo Performing Arts is supported in part by the Mass Cultural Council, a state agency."
};

const ProgramSection = ({ s, update, onGoSection, cover }) => {
  const editing = useEditMode();

  // Resolve HTML content — prefer saved HTML, fall back to legacy pieces
  const htmlContent = s.programHtml != null
    ? s.programHtml
    : piecesToHtml(s.pieces || (s.rawProgram ? parseLegacy(s.rawProgram) : []));

  const sp = s.sponsor || {};
  const setSp = (patch) => update({ sponsor: { ...sp, ...patch } });
  const mgmt = (sp.mgmtCredits && sp.mgmtCredits.length ? sp.mgmtCredits : (sp.arrangements || [])).filter(x => x != null);
  const setMgmt = (list) => setSp({ mgmtCredits: list, arrangements: undefined });
  const seasonLabel = sp.seasonSponsorsLabel || sp.label || PROGRAM_STANDARD.seasonSponsorsLabel;
  const seasonNames = sp.seasonSponsors != null ? sp.seasonSponsors : (sp.name || "");
  const massLine = sp.closing != null && sp.closing !== "" ? sp.closing : PROGRAM_STANDARD.massCultural;

  return (
    <div>
      {/* Performance header */}
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

      {/* Program body — WYSIWYG in edit mode, rendered HTML in read mode */}
      {editing ? (
        <ProgramEditor
          value={htmlContent}
          onChange={html => update({ programHtml: html })}
        />
      ) : (
        <div className="prog-html" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      )}

      {/* Runtime note */}
      {editing ? (
        <PlainField className="prog-runtime-field" label="Run time note" value={s.runtimeNote || ""} placeholder="Approximately 1 hour 50 minutes, including intermission" onChange={v => update({ runtimeNote: v })} multiline />
      ) : (s.runtimeNote ? <p className="program-runtime" dangerouslySetInnerHTML={{ __html: s.runtimeNote }} /> : null)}

      {/* Extra rich text blocks */}
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

      {/* Credits & sponsors */}
      {editing ? (
        <div className="prog-sponsor-edit">
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

// Legacy rawProgram string → pieces array (kept here for migration only)
function parseLegacy(text) {
  const out = [];
  String(text || "").replace(/\r/g, "").split(/\n\s*\n/).forEach(block => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    lines.forEach((ln, i) => {
      if (/^intermission$/i.test(ln)) { out.push({ kind: "intermission" }); return; }
      const cur = out.length ? out[out.length - 1] : null;
      if (i === 0 || !cur || cur.kind === "intermission") {
        const noComp = ln.match(/^[—–]\s+(.+)$/);
        if (noComp) { out.push({ composer: "", work: noComp[1].trim(), movements: [] }); return; }
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
}

export { ProgramSection };
