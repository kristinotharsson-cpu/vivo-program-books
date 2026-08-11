import React from 'react';
import { Editable } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';
import { ProgramEditor } from '../program-editor.jsx';

const esc = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const bodyToHtml = (body) => (body || []).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');

// ---- NOTES (long-form) ----
const NotesSection = ({ s, update }) => {
  const editing = useEditMode();
  const slugify = (t, i) => "note-" + (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + i;
  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const sc = document.scrollingElement || document.documentElement;
    sc.scrollTo({ top: el.getBoundingClientRect().top + sc.scrollTop - 76, behavior: "smooth" });
  };
  const headed = (s.sections || []).map((sec, i) => ({ sec, i, id: slugify(sec.h, i) })).filter(x => (x.sec.h || "").trim());
  const showIndex = s.showIndex !== false && headed.length > 1;

  const updateSection = (i, patch) => {
    const sections = [...s.sections];
    sections[i] = { ...sections[i], ...patch };
    update({ sections });
  };

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

      {s.sections.map((sec, i) => {
        const secId = slugify(sec.h, i);
        const bodyHtml = sec.bodyHtml != null ? sec.bodyHtml : bodyToHtml(sec.body);
        return (
          <div key={i} id={secId} className="note-block">
            <Editable as="h3" value={sec.h} onChange={v => updateSection(i, { h: v })} />
            {(sec.sub || editing) ? (
              <Editable as="p" className="note-subtitle" value={sec.sub || ""} onChange={v => updateSection(i, { sub: v })} multiline />
            ) : null}

            {editing ? (
              <ProgramEditor
                value={bodyHtml}
                onChange={html => updateSection(i, { bodyHtml: html })}
              />
            ) : (
              <div className="prog-html note-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            )}

            {editing ? (
              <div className="prog-edit">
                <button onClick={() => {
                  const sections = [...s.sections]; const j = i - 1; if (j < 0) return;
                  [sections[i], sections[j]] = [sections[j], sections[i]]; update({ sections });
                }}>↑</button>
                <button onClick={() => {
                  const sections = [...s.sections]; const j = i + 1; if (j >= sections.length) return;
                  [sections[i], sections[j]] = [sections[j], sections[i]]; update({ sections });
                }}>↓</button>
                <button onClick={() => { update({ sections: s.sections.filter((_, j) => j !== i) }); window.__vivoToast && window.__vivoToast("Note deleted · ⌘Z to undo"); }}>Delete note</button>
              </div>
            ) : null}
          </div>
        );
      })}

      {editing ? (
        <div className="prog-edit prog-edit-add">
          <button onClick={() => update({ sections: [...(s.sections || []), { h: "New Note", bodyHtml: "" }] })}>+ Add Note</button>
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

export { NotesSection, SynopsisSection };
