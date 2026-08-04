import React from 'react';
import { Editable } from './components.jsx';
import { useEditMode } from './edit-mode-context.jsx';

// Song texts / vocal recital texts.
// Per-song display mode (each song can differ — dual-language, original-only, etc.),
// a jump index so readers reach any piece fast, and mobile-first layout.
// Works identically in the editor and the exported standalone HTML.
// Schema: section.kind === "songtexts"
// { kind, title, lead, songs: [{ id, title, composer, note, origLang, mode?, stanzas: [{ original:[lines], translation:[lines] }] }] }
const MODES = [
  ["side-by-side", "Side by side"],
  ["stacked", "Stacked"],
  ["interlinear", "Interlinear"],
  ["original", "Original"],
  ["translation", "Translation"]
];

const SongTextsSection = ({ s, update, defaultMode }) => {
  const editing = useEditMode();
  const songs = s.songs || [];
  // Per-song reader overrides (session only). Keyed by song index.
  const [overrides, setOverrides] = React.useState({});
  const slug = (song, i) => song.id || ("song-" + i);

  const updateSong = (i, patch) => {
    const next = [...songs]; next[i] = { ...next[i], ...patch }; update({ songs: next });
  };
  const updateLine = (si, sti, which, li, v) => {
    const next = [...songs];
    const song = { ...next[si] };
    const stanzas = [...(song.stanzas || [])];
    const st = { ...stanzas[sti] };
    const lines = [...(st[which] || [])]; lines[li] = v;
    st[which] = lines; stanzas[sti] = st; song.stanzas = stanzas; next[si] = song;
    update({ songs: next });
  };
  const hasTranslation = (song) => (song.stanzas || []).some(st => (st.translation || []).length && (st.translation || []).some(l => (l || "").trim()));

  const addSong = () => update({ songs: [...songs, { id: "piece-" + (songs.length + 1), title: "New Piece", composer: "", note: "", origLang: "", stanzas: [{ original: [""], translation: [""] }] }] });
  const removeSong = (i) => { const n = [...songs]; n.splice(i, 1); update({ songs: n }); };
  const addStanza = (si) => { const song = { ...songs[si], stanzas: [...(songs[si].stanzas || []), { original: [""], translation: [""] }] }; const n = [...songs]; n[si] = song; update({ songs: n }); };
  const removeStanza = (si, sti) => { const stanzas = [...(songs[si].stanzas || [])]; stanzas.splice(sti, 1); const n = [...songs]; n[si] = { ...songs[si], stanzas }; update({ songs: n }); };
  const addLine = (si, sti) => { const song = { ...songs[si] }; const stanzas = [...(song.stanzas || [])]; const st = { ...stanzas[sti] }; st.original = [...(st.original || []), ""]; st.translation = [...(st.translation || []), ""]; stanzas[sti] = st; song.stanzas = stanzas; const n = [...songs]; n[si] = song; update({ songs: n }); };

  // Effective mode for a song: reader override → saved per-song mode → global default.
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
    const orig = st.original || [];
    const trans = st.translation || [];
    const line = (which, arr, li) => editing
      ? <Editable key={which + li} as="div" className="st-line" value={arr[li] || ""} onChange={v => updateLine(si, sti, which, li, v)} />
      : <div key={which + li} className="st-line">{arr[li] || "\u00A0"}</div>;

    if (mode === "original") return <div className="st-col st-orig">{orig.map((_, i) => line("original", orig, i))}</div>;
    if (mode === "translation") return <div className="st-col st-trans">{trans.map((_, i) => line("translation", trans, i))}</div>;
    if (mode === "interlinear") {
      const n = Math.max(orig.length, trans.length);
      return (
        <div className="st-col">
          {Array.from({ length: n }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="st-line st-orig">{editing ? <Editable as="span" value={orig[i] || ""} onChange={v => updateLine(si, sti, "original", i, v)} /> : (orig[i] || "\u00A0")}</div>
              <div className="st-line st-trans">{editing ? <Editable as="span" value={trans[i] || ""} onChange={v => updateLine(si, sti, "translation", i, v)} /> : (trans[i] || "\u00A0")}</div>
            </React.Fragment>
          ))}
        </div>
      );
    }
    if (mode === "stacked") {
      return (
        <div className="st-col">
          <div className="st-block st-orig">{orig.map((_, i) => line("original", orig, i))}</div>
          <div className="st-block st-trans">{trans.map((_, i) => line("translation", trans, i))}</div>
        </div>
      );
    }
    // side-by-side: two columns aligned per stanza
    return (
      <div className="st-cols">
        <div className="st-col st-orig">{orig.map((_, i) => line("original", orig, i))}</div>
        <div className="st-col st-trans">{trans.map((_, i) => line("translation", trans, i))}</div>
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
        return (
          <article key={song.id || si} id={"st-" + slug(song, si)} className="st-song">
            <header className="st-song-head">
              <Editable as="h3" className="st-song-title" value={song.title || ""} onChange={v => updateSong(si, { title: v })} />
              {(song.composer || editing) ? <Editable as="div" className="st-song-composer" value={song.composer || ""} onChange={v => updateSong(si, { composer: v })} /> : null}
              {(song.note || editing) ? <Editable as="p" className="st-song-note" value={song.note || ""} onChange={v => updateSong(si, { note: v })} multiline /> : null}
            </header>

            {translated ? (
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
                    <button onClick={() => addLine(si, sti)}>+ Line</button>
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
