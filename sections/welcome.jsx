import React from 'react';
import { Editable, PlainField } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';
import { ProgramEditor } from '../program-editor.jsx';

// Migrate legacy quote + body array to HTML on first load
function welcomeToHtml(quote, body) {
  const esc = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const parts = [];
  if (quote && quote.trim()) parts.push(`<blockquote><p>${esc(quote)}</p></blockquote>`);
  (body || []).forEach(p => { if (p && p.trim()) parts.push(`<p>${esc(p)}</p>`); });
  return parts.join('');
}

const WelcomeSection = ({ s, update }) => {
  const editing = useEditMode();

  const htmlContent = s.welcomeHtml != null
    ? s.welcomeHtml
    : welcomeToHtml(s.quote, s.body);

  return (
    <div className="welcome-page">
      {editing ? (
        <ProgramEditor
          value={htmlContent}
          onChange={html => update({ welcomeHtml: html })}
        />
      ) : (
        <div className="prog-html welcome-html" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      )}

      <div className="signature">
        <Editable as="div" className="name" value={s.signature?.name || ''} onChange={v => update({ signature: { ...s.signature, name: v } })} />
        <Editable as="div" className="role" value={s.signature?.role || ''} onChange={v => update({ signature: { ...s.signature, role: v } })} />
      </div>
    </div>
  );
};

export { WelcomeSection };
