import React, { useState } from 'react';
import { Editable, PlainField, PhotoSlot } from '../components.jsx';
import { useEditMode } from '../edit-mode-context.jsx';
import { VivoAccordion } from './shared-content.jsx';
import { ProgramEditor } from '../program-editor.jsx';

const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const bodyToHtml = (body) => (body || []).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');

// ---- INFO (land ack, accessibility, safety, contact) ----
const VENUE_LINKS = {
  "arlington street church": "https://www.vivoperformingarts.org/in-the-community/discover/arlington-street-church/",
  "arrow street arts": "https://www.vivoperformingarts.org/in-the-community/discover/arrow-street-arts/",
  "berklee performance center": "https://www.vivoperformingarts.org/in-the-community/discover/berklee-performance-center/",
  "bethel ame church": "https://www.vivoperformingarts.org/in-the-community/discover/bethel-a-m-e-church/",
  "bethel a.m.e. church": "https://www.vivoperformingarts.org/in-the-community/discover/bethel-a-m-e-church/",
  "boch center wang theatre": "https://www.vivoperformingarts.org/in-the-community/discover/boch-center-wang-theatre/",
  "boston arts academy theater": "https://www.vivoperformingarts.org/in-the-community/discover/boston-arts-academy-theatre/",
  "boston arts academy theatre": "https://www.vivoperformingarts.org/in-the-community/discover/boston-arts-academy-theatre/",
  "boston public library roxbury branch": "https://www.vivoperformingarts.org/in-the-community/discover/boston-public-library-roxbury-branch/",
  "cutler majestic theatre at emerson college": "https://www.vivoperformingarts.org/in-the-community/discover/cutler-majestic-theatre-at-emerson-college/",
  "cutler majestic theatre": "https://www.vivoperformingarts.org/in-the-community/discover/cutler-majestic-theatre-at-emerson-college/",
  "crystal ballroom at somerville theatre": "https://www.vivoperformingarts.org/in-the-community/discover/crystal-ballroom-at-somerville-theatre/",
  "dewey square plaza": "https://www.vivoperformingarts.org/in-the-community/discover/dewey-square-plaza/",
  "first church roxbury": "https://www.vivoperformingarts.org/in-the-community/discover/first-church-roxbury/",
  "groton hill music center": "https://www.vivoperformingarts.org/in-the-community/discover/groton-hill-music-center/",
  "longy's pickman hall": "https://www.vivoperformingarts.org/in-the-community/discover/longy-s-pickman-hall/",
  "pickman hall": "https://www.vivoperformingarts.org/in-the-community/discover/longy-s-pickman-hall/",
  "multicultural arts center": "https://www.vivoperformingarts.org/in-the-community/discover/multicultural-arts-center/",
  "museum of science": "https://www.vivoperformingarts.org/in-the-community/discover/museum-of-science/",
  "nec's jordan hall": "https://www.vivoperformingarts.org/in-the-community/discover/nec-s-jordan-hall/",
  "jordan hall": "https://www.vivoperformingarts.org/in-the-community/discover/nec-s-jordan-hall/",
  "roxbury community college media arts center": "https://www.vivoperformingarts.org/in-the-community/discover/roxbury-community-college/",
  "salvation army kroc center": "https://www.vivoperformingarts.org/in-the-community/discover/salvation-army-kroc-center/",
  "sanders theatre": "https://www.vivoperformingarts.org/in-the-community/discover/sanders-theatre/",
  "symphony hall": "https://www.vivoperformingarts.org/in-the-community/discover/symphony-hall/",
  "twelfth baptist church": "https://www.vivoperformingarts.org/in-the-community/discover/twelfth-baptist-church/",
  "shaw-roxbury branch, boston public library": "https://www.vivoperformingarts.org/in-the-community/discover/boston-public-library-roxbury-branch/",
  "shaw goodman branch": "https://www.vivoperformingarts.org/in-the-community/discover/boston-public-library-roxbury-branch/",
  "roxbury community college": "https://www.vivoperformingarts.org/in-the-community/discover/roxbury-community-college/",
  "cathedral church of saint paul": "https://www.vivoperformingarts.org/in-the-community/discover/cathedral-church-of-st-paul/",
  "cathedral church of st paul": "https://www.vivoperformingarts.org/in-the-community/discover/cathedral-church-of-st-paul/",
  "first church, boston uu": "https://www.vivoperformingarts.org/in-the-community/discover/",
  "first church boston": "https://www.vivoperformingarts.org/in-the-community/discover/"
};
const _normVenue = (t) => (t || "").toLowerCase().replace(/[''.,]/g, "").replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
const _VENUE_NORM = Object.keys(VENUE_LINKS).map(k => [_normVenue(k), VENUE_LINKS[k]]).sort((a, b) => b[0].length - a[0].length);
const venueUrlFor = (text) => {
  const key = _normVenue(text);
  if (!key) return null;
  for (const [k, url] of _VENUE_NORM) { if (k === key) return url; }
  for (const [k, url] of _VENUE_NORM) { if (key.includes(k)) return url; }
  return null;
};
const InfoSection = ({ s, update }) => {
  const editing = useEditMode();
  const audienceInfo = (s.audienceInfo && s.audienceInfo.length) ? s.audienceInfo : ((window.VIVO_SHARED && window.VIVO_SHARED.audienceInfo) || []);

  const updateAudienceItem = (i, patch) => {
    const items = audienceInfo.map((item, j) => j === i ? { ...item, ...patch } : { ...item });
    update({ audienceInfo: items });
  };
  const addAudienceItem = () => {
    update({ audienceInfo: [...audienceInfo, { id: "ai-" + Date.now().toString(36), title: "New Section", bodyHtml: "" }] });
  };
  const removeAudienceItem = (i) => {
    update({ audienceInfo: audienceInfo.filter((_, j) => j !== i) });
    window.__vivoToast && window.__vivoToast("Section deleted · ⌘Z to undo");
  };

  const isLandAck = (sec) => /land\s*acknowledge?ment/i.test((sec.h || "").trim());
  // Land Acknowledgment always closes the page.
  const ordered = [...(s.sections || [])].map((sec, i) => ({ sec, i }))
    .sort((a, b) => (isLandAck(a.sec) ? 1 : 0) - (isLandAck(b.sec) ? 1 : 0));
  const deleteSection = (i) => {
    update({ sections: s.sections.filter((_, j) => j !== i) });
    window.__vivoToast && window.__vivoToast("Section deleted · ⌘Z to undo");
  };
  const renderBlock = ({ sec, i }) => {
      const isVenue = /^venue$/i.test((sec.h || "").trim());
      return (
      <div key={i} className={isLandAck(sec) ? "info-land-ack" : undefined}>
        <Editable as="h3" value={sec.h} onChange={v => {
          const sections = [...s.sections]; sections[i] = { ...sec, h: v }; update({ sections });
        }} />
        {isVenue && (sec.imageSrc || editing) ? (
          <div className="venue-photo">
            <PhotoSlot fill src={sec.imageSrc || ""} alt="Venue" initials="VENUE PHOTO"
              onChange={(src) => { const sections = [...s.sections]; sections[i] = { ...sec, imageSrc: src }; update({ sections }); }}
              onClear={() => { const sections = [...s.sections]; sections[i] = { ...sec, imageSrc: "" }; update({ sections }); }} />
          </div>
        ) : null}
        {sec.body.map((p, pi) => {
          const vUrl = isVenue && !editing ? venueUrlFor(p) : null;
          if (vUrl) return <p key={pi} className="venue-link-wrap"><a className="venue-btn" href={vUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); window.open(vUrl, '_blank', 'noopener,noreferrer'); }}>{(p || "").replace(/\.$/, "")}<span className="venue-btn-arrow" aria-hidden="true">↗</span></a></p>;
          return (
          <Editable key={pi} as="p" value={p} onChange={v => {
            const sections = [...s.sections];
            const body = [...sec.body]; body[pi] = v;
            sections[i] = { ...sec, body };
            update({ sections });
          }} multiline />
          );
        })}
        {editing ? (
          <div className="prog-edit" style={{ marginTop: 6 }}>
            <button onClick={() => deleteSection(i)}>Delete section</button>
          </div>
        ) : null}
      </div>
      );
  };
  return (
  <div>
    {ordered.filter(x => !isLandAck(x.sec)).map(renderBlock)}
    {(audienceInfo.length || editing) ? (
      <div className="vivo-band" style={{ marginTop: 24 }}>
        {audienceInfo.map((item, idx) => editing ? (
          <div key={item.id || idx} className="info-accordion-edit">
            <input
              className="info-accordion-title-input"
              value={item.title || ""}
              placeholder="Section title…"
              onChange={e => updateAudienceItem(idx, { title: e.target.value })}
            />
            <ProgramEditor
              value={item.bodyHtml != null ? item.bodyHtml : bodyToHtml(item.body)}
              onChange={html => updateAudienceItem(idx, { bodyHtml: html })}
            />
            <div className="prog-edit">
              <button onClick={() => removeAudienceItem(idx)}>Delete section</button>
            </div>
          </div>
        ) : (
          <VivoAccordion key={item.id} id={item.id} title={item.title} accent="green" defaultOpen={false}>
            <div className="prog-html" dangerouslySetInnerHTML={{ __html: item.bodyHtml != null ? item.bodyHtml : bodyToHtml(item.body) }} />
          </VivoAccordion>
        ))}
        {editing ? (
          <div className="prog-edit prog-edit-add" style={{ marginTop: 8 }}>
            <button onClick={addAudienceItem}>+ Add section</button>
          </div>
        ) : null}
      </div>
    ) : null}
    {ordered.filter(x => isLandAck(x.sec)).map(renderBlock)}
  </div>
  );
};

export { InfoSection };
