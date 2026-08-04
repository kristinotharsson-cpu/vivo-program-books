import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Editable, PlainField, PhotoSlot, RowControls, AddRowButton, SectionBottomNav } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';

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
  const editing = useEditMode();
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
            {[gt("date"), gt("time"), gt("venue")].filter(Boolean).join("   ")}
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
          placeholder={"LUDWIG VAN BEETHOVEN — Sonata No. 21 in C major, Op. 53 “Waldstein”\nAllegro con brio\nRondo: Allegretto moderato\n\nINTERMISSION\n\nFRÉDÉRIC CHOPIN — Ballade No. 4 in F minor, Op. 52\n(Arr. for two pianos)"}
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

export { ProgramSection };
