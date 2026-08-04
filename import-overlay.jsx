// In-shell PDF import overlay. Cover fields are preserved from the shell —
// the parser may only fill sections. Stage 2 parsing goes through
// /.netlify/functions/parse when deployed; otherwise shows extraction for review.
const { useState: useSI, useRef: useRI } = React;

function ensurePdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.crossOrigin = "anonymous";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function ensureExtractor() {
  if (window.extractPdfText) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "parser/extract-text.jsx";
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function ImportOverlay({ open, onClose, hasContent, onApplySections, setToast }) {
  const [phase, setPhase] = useSI("confirm"); // confirm | pick | extracting | parsing | review | error
  const [error, setError] = useSI("");
  const [extracted, setExtracted] = useSI(null);
  const [fileName, setFileName] = useSI("");
  const fileRef = useRI(null);
  if (!open) return null;

  const start = hasContent && phase === "confirm";

  const pick = () => { if (fileRef.current) { fileRef.current.value = ""; fileRef.current.click(); } };
  const retry = () => { setError(""); setExtracted(null); setFileName(""); setPhase("pick"); if (fileRef.current) fileRef.current.value = ""; };

  const run = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setPhase("extracting");
    try {
      await ensurePdfJs(); await ensureExtractor();
      const res = await window.extractPdfText(await file.arrayBuffer());
      if (res.stats.imageOnly) { setError("No extractable text — this looks like a scanned PDF."); setPhase("error"); return; }
      setExtracted(res);
      // Stage 2: server-side parse (deployed only)
      setPhase("parsing");
      try {
        const r = await fetch("/.netlify/functions/parse", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: res.structuredText })
        });
        if (r.ok) {
          const parsed = await r.json();
          if (parsed && parsed.sections) {
            onApplySections(parsed.sections, parsed._meta);
            setToast("Program imported — review flagged sections");
            onClose();
            return;
          }
        }
        throw new Error("parser unavailable");
      } catch (e) {
        setPhase("review"); // parser not deployed — offer the extraction
      }
    } catch (e) {
      console.error(e);
      setError(String(e && e.message || e));
      setPhase("error");
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([extracted.structuredText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/\.pdf$/i, "") + "_input.txt";
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <>
      <div className="menu-overlay" onClick={onClose} />
      <div className="import-sheet" role="dialog" aria-label="Import PDF">
        <div className="import-sheet-title">Import PDF</div>
        {start ? (
          <>
            <p className="import-sheet-body">This program already has content. Importing will <strong>replace existing sections</strong> (cover info is kept). Continue?</p>
            <div className="import-sheet-actions">
              <button className="import-sheet-btn" onClick={() => setPhase("pick")}>Replace content</button>
              <button className="import-sheet-btn is-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : phase === "confirm" || phase === "pick" ? (
          <>
            <p className="import-sheet-body">Upload this show's print PDF. The parser fills in pieces, credits, notes, and sponsors — cover title, date, and venue stay as they are.</p>
            <div className="import-sheet-actions">
              <button className="import-sheet-btn" onClick={pick}>Choose PDF</button>
              <button className="import-sheet-btn is-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : phase === "extracting" || phase === "parsing" ? (
          <p className="import-sheet-body">{phase === "extracting" ? "Extracting text from " + fileName + "…" : "Parsing program content…"}</p>
        ) : phase === "review" ? (
          <>
            <p className="import-sheet-body">Text extracted ({extracted.stats.pages} pages). The auto-parser isn't available in this environment — download the extraction and run it through the parser, or paste content manually.</p>
            <div className="import-sheet-actions">
              <button className="import-sheet-btn" onClick={downloadTxt}>Download extraction</button>
              <button className="import-sheet-btn is-ghost" onClick={retry}>Try another PDF</button>
              <button className="import-sheet-btn is-ghost" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <>
            <p className="import-sheet-body import-sheet-error">{error}</p>
            <div className="import-sheet-actions">
              <button className="import-sheet-btn" onClick={retry}>Try another PDF</button>
              <button className="import-sheet-btn is-ghost" onClick={onClose}>Close</button>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={(e) => run(e.target.files && e.target.files[0])} />
      </div>
    </>
  );
}

window.ImportOverlay = ImportOverlay;
