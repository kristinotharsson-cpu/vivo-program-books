// Song texts with six reader-switchable translation display modes.
// Works identically in the editor and the exported standalone HTML.
// Schema: section.kind === "songtexts"
// { kind, title, songs: [{ id, title, composer, note, origLang, stanzas: [{ original: [lines], translation: [lines] }] }] }
const MODES = [
  ["side-by-side", "Side by side"],
  ["stacked", "Stacked"],
  ["interlinear", "Interlinear"],
  ["facing", "Facing"],
  ["original", "Original only"],
  ["translation", "Translation only"]
];

const SongTextsSection = ({ s, update }) => {
  const [mode, setMode] = React.useState(() => localStorage.getItem("vivo-songtext-mode") || "side-by-side");
  const pick = (m) => { setMode(m); try { localStorage.setItem("vivo-songtext-mode", m); } catch (e) {} };
  const editing = window.__editMode;
  const updateSong = (i, patch) => {
    const songs = [...(s.songs || [])]; songs[i] = { ...songs[i], ...patch };
    update({ songs });
  };
  const updateLine = (si, sti, which, li, v) => {
    const songs = [...(s.songs || [])];
    const song = { ...songs[si] };
    const stanzas = [...(song.stanzas || [])];
    const st = { ...stanzas[sti] };
    const lines = [...(st[which] || [])]; lines[li] = v;
    st[which] = lines; stanzas[sti] = st; song.stanzas = stanzas; songs[si] = song;
    update({ songs });
  };

  const renderStanza = (song, st, sti, si) => {
    const orig = st.original || [];
    const trans = st.translation || [];
    const line = (which, arr, li) => editing
      ? <Editable key={which + li} as="div" className="st-line" value={arr[li] || ""} onChange={v => updateLine(si, sti, which, li, v)} />
      : <div key={which + li} className="st-line">{arr[li] || "\u00A0"}</div>;

    if (mode === "original") return <div className="st-col">{orig.map((_, i) => line("original", orig, i))}</div>;
    if (mode === "translation") return <div className="st-col">{trans.map((_, i) => line("translation", trans, i))}</div>;
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
    // side-by-side & facing: two columns; side-by-side aligns per stanza (this render is per stanza already)
    return (
      <div className="st-cols">
        <div className="st-col st-orig">{orig.map((_, i) => line("original", orig, i))}</div>
        <div className="st-col st-trans">{trans.map((_, i) => line("translation", trans, i))}</div>
      </div>
    );
  };

  const renderSong = (song, si) => {
    const hasTrans = (song.stanzas || []).some(st => (st.translation || []).length);
    if (mode === "facing" && hasTrans) {
      // facing: each column flows independently over the whole song
      return (
        <div className="st-cols st-facing">
          <div className="st-col st-orig">{(song.stanzas || []).map((st, i) => <div key={i} className="st-stanza">{(st.original || []).map((l, j) => <div key={j} className="st-line">{l}</div>)}</div>)}</div>
          <div className="st-col st-trans">{(song.stanzas || []).map((st, i) => <div key={i} className="st-stanza">{(st.translation || []).map((l, j) => <div key={j} className="st-line">{l}</div>)}</div>)}</div>
        </div>
      );
    }
    return (song.stanzas || []).map((st, sti) => (
      <div key={sti} className="st-stanza">{renderStanza(song, st, sti, si)}</div>
    ));
  };

  return (
    <div className="songtexts">
      {s.lead ? <Editable as="p" className="lead" value={s.lead} onChange={v => update({ lead: v })} multiline /> : null}
      <div className="st-toolbar" role="group" aria-label="Text display mode">
        {MODES.map(([m, label]) => (
          <button key={m} aria-pressed={mode === m} onClick={() => pick(m)}>{label}</button>
        ))}
      </div>
      {(s.songs || []).map((song, si) => (
        <article key={song.id || si} className="st-song">
          <header className="st-song-head">
            <Editable as="h3" className="st-song-title" value={song.title || ""} onChange={v => updateSong(si, { title: v })} />
            {song.composer ? <Editable as="div" className="st-song-composer" value={song.composer} onChange={v => updateSong(si, { composer: v })} /> : null}
            {song.note ? <Editable as="p" className="st-song-note" value={song.note} onChange={v => updateSong(si, { note: v })} multiline /> : null}
          </header>
          {renderSong(song, si)}
        </article>
      ))}
    </div>
  );
};

window.SongTextsSection = SongTextsSection;
