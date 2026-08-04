import React, { useState as useS, useRef as useR, useCallback as useC } from 'react';
import ReactDOM from 'react-dom/client';
// /import — single-PDF import (Stage 1: extract & review the structured text).

const LEGEND = [
  ["# / ## / ###", "heading size (largest → smallest)"],
  ["*text*", "italic run"],
  ["\u27e8center\u27e9 \u27e8right\u27e9", "alignment hint"],
  ["\u27e8bold\u27e9", "bold body run"],
  ["  indent", "indented (e.g. movements, sub-items)"],
  ["=== PAGE n ===", "page boundary"],
];

function ImportApp() {
  const [state, setState] = useS("idle"); // idle | working | done | error
  const [fileName, setFileName] = useS("");
  const [progress, setProgress] = useS(null);
  const [result, setResult] = useS(null);
  const [error, setError] = useS("");
  const [dragOver, setDragOver] = useS(false);
  const [copied, setCopied] = useS(false);
  const inputRef = useR(null);

  const run = useC(async (file) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) { setError("Please choose a PDF file."); setState("error"); return; }
    setFileName(file.name);
    setState("working");
    setError("");
    setResult(null);
    setProgress({ page: 0, total: 0 });
    try {
      const buf = await file.arrayBuffer();
      const res = await window.extractPdfText(buf, {
        onProgress: (p) => setProgress(p),
      });
      if (res.stats.imageOnly) {
        setError("This PDF has little or no extractable text — it may be scanned/image-only. OCR fallback is not built yet.");
        setState("error");
        return;
      }
      setResult(res);
      setState("done");
    } catch (e) {
      console.error(e);
      setError(String(e && e.message || e));
      setState("error");
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    run(f);
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.structuredText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    });
  };

  const download = () => {
    if (!result) return;
    const base = fileName.replace(/\.pdf$/i, "") || "extracted";
    const blob = new Blob([result.structuredText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = base + "_input.txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const reset = () => { setState("idle"); setResult(null); setError(""); setFileName(""); setProgress(null); };

  return (
    <div className="imp">
      <header className="imp-head">
        <div className="imp-eyebrow">Vivo Program Books</div>
        <h1 className="imp-title">Import from PDF</h1>
        <p className="imp-sub">Stage 1 — extract text with layout hints, review, then hand off to the parser.</p>
      </header>

      {state === "idle" || state === "error" ? (
        <div
          className={"imp-drop" + (dragOver ? " is-over" : "")}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current && inputRef.current.click()}
          role="button"
          tabIndex={0}
        >
          <div className="imp-drop-icon">PDF</div>
          <div className="imp-drop-main">Drop a program PDF here</div>
          <div className="imp-drop-alt">or click to browse</div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: "none" }}
            onChange={(e) => run(e.target.files && e.target.files[0])}
          />
        </div>
      ) : null}

      {state === "error" ? <div className="imp-error">{error}</div> : null}

      {state === "working" ? (
        <div className="imp-working">
          <div className="imp-spinner" />
          <div className="imp-working-file">{fileName}</div>
          <div className="imp-working-status">
            {progress && progress.total
              ? `Extracting page ${progress.page} of ${progress.total}…`
              : "Reading PDF…"}
          </div>
        </div>
      ) : null}

      {state === "done" && result ? (
        <div className="imp-result">
          <div className="imp-result-bar">
            <div className="imp-stats">
              <span><strong>{fileName}</strong></span>
              <span>{result.stats.pages} pages</span>
              <span>{result.stats.chars.toLocaleString()} chars</span>
            </div>
            <div className="imp-actions">
              <button className="imp-btn" onClick={copy}>{copied ? "Copied" : "Copy text"}</button>
              <button className="imp-btn" onClick={download}>Download .txt</button>
              <button className="imp-btn imp-btn-ghost" onClick={reset}>New PDF</button>
            </div>
          </div>

          <details className="imp-legend" open>
            <summary>Annotation legend</summary>
            <ul>
              {LEGEND.map(([k, v], i) => (
                <li key={i}><code>{k}</code><span>{v}</span></li>
              ))}
            </ul>
          </details>

          <textarea className="imp-out" readOnly value={result.structuredText} spellCheck={false} />

          <div className="imp-next">
            This is the structured input Stage 2 sends to the parser. To use it as a few-shot
            example, save it as <code>parser-package/fewshot/&lt;type&gt;_input.txt</code>.
          </div>
        </div>
      ) : null}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("import-root")).render(<ImportApp />);
