import React from 'react';
import { Editable } from './components.jsx';
import { useEditMode } from './edit-mode-context.jsx';
import { ProgramEditor } from './program-editor.jsx';

// Song texts / vocal recital texts.
// Schema: section.kind === "songtexts"
// { kind, title, lead, songs: [{ id, title, composer, noteHtml, origLang, mode?, stanzas: [{ origHtml, transHtml }] }] }
const MODES = [
  ["side-by-side", "Side by side"],
  ["stacked", "Stacked"],
  ["interlinear", "Interlinear"],
  ["original", "Original"],
  ["translation", "Translation"]
];

const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const linesToHtml = (lines) => (lines || []).filter(l => l != null).map(l => `<p>${esc(l)}</p>`).join('');

// Interlinear display: parse HTML into per-element pairs and interleave them.
function InterleavedView({ origHtml, transHtml }) {
  const pairs = React.useMemo(() => {
    const parse = (html) => {
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(doc.body.children).map(el => el.outerHTML);
    };
    const orig = parse(origHtml);
    const trans = parse(transHtml);
    const n = Math.max(orig.length, trans.length);
    return Array.from({ length: n }, (_, i) => ({ orig: orig[i] || '', trans: trans[i] || '' }));
  }, [origHtml, transHtml]);

  return (
    <div className="st-col">
      {pairs.map(({ orig, trans }, i) => (
        <React.Fragment key={i}>
          {orig ? <div className="st-line st-orig" dangerouslySetInnerHTML={{ __html: orig }} /> : null}
          {trans ? <div className="st-line st-trans" dangerouslySetInnerHTML={{ __html: trans }} /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

const SongTextsSection = ({ s, update, defaultMode }) => {
  const editing = useEditMode();
  const songs = s.songs || [];
  const [overrides, setOverrides] = React.useState({});
  const slug = (song, i) => song.id || ("song-" + i);

  const updateSong = (i, patch) => {
    const next = [...songs]; next[i] = { ...next[i], ...patch }; update({ songs: next });
  };
  const updateStanza = (si, sti, patch) => {
    const next = [...songs];
    const song = { ...next[si] };
    const stanzas = [...(song.stanzas || [])];
    stanzas[sti] = { ...stanzas[sti], ...patch };
    song.stanzas = stanzas;
    next[si] = song;
    update({ songs: next });
  };

  const hasTranslation = (song) => (song.stanzas || []).some(st => {
    if (st.transHtml != null) return st.transHtml.trim().length > 0;
    return (st.translation || []).some(l => (l || "").trim());
  });

  const addSong = () => update({ songs: [...songs, { id: "piece-" + (songs.length + 1), title: "New Piece", composer: "", noteHtml: "", origLang: "", stanzas: [{ origHtml: "", transHtml: "" }] }] });
  const removeSong = (i) => { const n = [...songs]; n.splice(i, 1); update({ songs: n }); };
  const addStanza = (si) => {
    const song = { ...songs[si], stanzas: [...(songs[si].stanzas || []), { origHtml: "", transHtml: "" }] };
    const n = [...songs]; n[si] = song; update({ songs: n });
  };
  const removeStanza = (si, sti) => {
    const stanzas = [...(songs[si].stanzas || [])]; stanzas.splice(sti, 1);
    const n = [...songs]; n[si] = { ...songs[si], stanzas }; update({ songs: n });
  };

  const songMode = (song, i) => {
    if (!hasTranslation(song)) return "original";
    return overrides[i] || song.mode || defaultMode || "side-by-side";
  };

  const jumpTo = (i) => {
    const el = document.getElementById("st-" + slug(songs[i], i));
    if (!el) return;
    const scroller = document.scrollingElement || document.documentElement;
    const top = el.getBoundingClientRect().top + scroller.scrollTop - 76;
    scroller.scrollTo({ top, behavior: "smooth" });
  };

  const renderStanza = (song, st, sti, si, mode) => {
    const origHtml = st.origHtml != null ? st.origHtml : linesToHtml(st.original);
    const transHtml = st.transHtml != null ? st.transHtml : linesToHtml(st.translation);

    if (editing) {
      return (
        <div className="st-stanza-editors">
          <div className="st-editor-col">
            <div className="st-editor-label">Original</div>
            <ProgramEditor value={origHtml} onChange={html => updateStanza(si, sti, { origHtml: html })} />
          </div>
          <div className="st-editor-col">
            <div className="st-editor-label">Translation</div>
            <ProgramEditor value={transHtml} onChange={html => updateStanza(si, sti, { transHtml: html })} />
          </div>
        </div>
      );
    }

    if (mode === "original") return <div className="st-col st-orig st-html" dangerouslySetInnerHTML={{ __html: origHtml }} />;
    if (mode === "translation") return <div className="st-col st-trans st-html" dangerouslySetInnerHTML={{ __html: transHtml }} />;
    if (mode === "stacked") {
      return (
        <div className="st-col">
          <div className="st-block st-orig st-html" dangerouslySetInnerHTML={{ __html: origHtml }} />
          <div className="st-block st-trans st-html" dangerouslySetInnerHTML={{ __html: transHtml }} />
        </div>
      );
    }
    if (mode === "interlinear") return <InterleavedView origHtml={origHtml} transHtml={transHtml} />;
    // side-by-side
    return (
      <div className="st-cols">
        <div className="st-col st-orig st-html" dangerouslySetInnerHTML={{ __html: origHtml }} />
        <div className="st-col st-trans st-html" dangerouslySetInnerHTML={{ __html: transHtml }} />
      </div>
    );
  };

  return (
    <div className="songtexts">
      {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}

      {songs.length > 1 ? (
        <nav className="st-index" aria-label="Jump to a piece">
          {songs.map((song, i) => (
            <button key={i} className="st-index-item" onClick={() => jumpTo(i)}>
              <span className="st-index-num">{i + 1}</span>
              <span className="st-index-title">{song.title || "Untitled"}</span>
            </button>
          ))}
        </nav>
      ) : null}

      {songs.map((song, si) => {
        const mode = songMode(song, si);
        const translated = hasTranslation(song);
        const noteHtml = song.noteHtml != null ? song.noteHtml : (song.note ? `<p>${esc(song.note)}</p>` : '');
        return (
          <article key={song.id || si} id={"st-" + slug(song, si)} className="st-song">
            <header className="st-song-head">
              <Editable as="h3" className="st-song-title" value={song.title || ""} onChange={v => updateSong(si, { title: v })} />
              {(song.composer || editing) ? <Editable as="div" className="st-song-composer" value={song.composer || ""} onChange={v => updateSong(si, { composer: v })} /> : null}
              {(noteHtml || editing) ? (
                editing
                  ? <ProgramEditor value={noteHtml} onChange={html => updateSong(si, { noteHtml: html })} />
                  : <div className="st-song-note prog-html" dangerouslySetInnerHTML={{ __html: noteHtml }} />
              ) : null}
            </header>

            {(translated || editing) ? (
              <div className="st-song-modes" role="group" aria-label="Display for this piece">
                {MODES.map(([m, label]) => (
                  <button key={m} aria-pressed={mode === m}
                    onClick={() => {
                      if (editing) { updateSong(si, { mode: m }); }
                      else { setOverrides(o => ({ ...o, [si]: m })); }
                    }}>{label}</button>
                ))}
                {editing ? <span className="st-song-modes-hint">Sets the default layout for this piece</span> : null}
              </div>
            ) : null}

            {(song.stanzas || []).map((st, sti) => (
              <div key={sti} className="st-stanza">
                {renderStanza(song, st, sti, si, mode)}
                {editing ? (
                  <div className="st-edit-row">
                    <button onClick={() => removeStanza(si, sti)}>Delete stanza</button>
                  </div>
                ) : null}
              </div>
            ))}
            {editing ? (
              <div className="st-edit-row">
                <button onClick={() => addStanza(si)}>+ Stanza</button>
                <button onClick={() => removeSong(si)}>Delete piece</button>
              </div>
            ) : null}
          </article>
        );
      })}
      {editing ? <div className="st-edit-row st-edit-add"><button onClick={addSong}>+ Add Piece</button></div> : null}
    </div>
  );
};

export { SongTextsSection };
