import React from 'react';
import { Editable } from '../components.jsx';

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

export { WelcomeSection };
