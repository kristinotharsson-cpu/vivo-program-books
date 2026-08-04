// Stage 1 — Client-side PDF text extraction with style hints.
// Exposes window.extractPdfText(arrayBuffer, { onProgress }) -> Promise<{
//   pages: [{ num, width, height, lines: [...] }],
//   structuredText: string,   // the concatenated input for Stage 2
//   stats: { pages, chars, imageOnly }
// }]
// Requires window.pdfjsLib (loaded from CDN in import.html).

(function () {
  const HINT = { H1: 1.8, H2: 1.4, H3: 1.22 }; // size multiples of page median

  function styleFlags(fontFamily) {
    const f = (fontFamily || "").toLowerCase();
    return {
      italic: /italic|oblique/.test(f),
      bold: /bold|black|heavy|semibold|demibold/.test(f),
    };
  }

  // Group text items sharing a baseline into lines.
  function buildLines(items, styles, pageWidth) {
    // Each item: { str, transform, width, height, fontName }
    const raw = items
      .filter((it) => it.str !== undefined)
      .map((it) => {
        const size = Math.hypot(it.transform[0], it.transform[1]) || it.height || 0;
        const x = it.transform[4];
        const y = it.transform[5];
        const fam = styles[it.fontName] && styles[it.fontName].fontFamily;
        const flags = styleFlags(fam);
        return { str: it.str, x, y, size, w: it.width || 0, italic: flags.italic, bold: flags.bold, eol: it.hasEOL };
      })
      .filter((it) => it.str.length);

    // Sort top-to-bottom (PDF y grows upward), then left-to-right.
    raw.sort((a, b) => (Math.abs(b.y - a.y) > 1.5 ? b.y - a.y : a.x - b.x));

    const lines = [];
    let cur = null;
    for (const it of raw) {
      const tol = Math.max(3, it.size * 0.5);
      if (!cur || Math.abs(it.y - cur.y) > tol) {
        cur = { y: it.y, items: [it] };
        lines.push(cur);
      } else {
        cur.items.push(it);
      }
    }

    return lines.map((ln) => {
      ln.items.sort((a, b) => a.x - b.x);
      // Join with a space when there's a visible gap between runs.
      let text = "";
      let prev = null;
      for (const it of ln.items) {
        if (prev) {
          const gap = it.x - (prev.x + prev.w);
          if (gap > prev.size * 0.28 && !/\s$/.test(text)) text += " ";
        }
        text += it.str;
        prev = it;
      }
      text = text.replace(/\s+/g, " ").trim();
      const leftX = ln.items[0].x;
      const rightX = ln.items[ln.items.length - 1].x + (ln.items[ln.items.length - 1].w || 0);
      const size = Math.max(...ln.items.map((i) => i.size));
      const italic = ln.items.every((i) => i.italic) && ln.items.some((i) => i.italic);
      const bold = ln.items.some((i) => i.bold);
      return { text, leftX, rightX, size, italic, bold, pageWidth };
    }).filter((l) => l.text.length);
  }

  function annotate(lines, pageWidth) {
    if (!lines.length) return [];
    const sizes = lines.map((l) => l.size).sort((a, b) => a - b);
    const median = sizes[Math.floor(sizes.length / 2)] || 1;
    // Body left margin = most common (min) left x, rounded.
    const lefts = lines.map((l) => Math.round(l.leftX));
    const margin = Math.min(...lefts);
    const indentUnit = pageWidth * 0.035;

    return lines.map((l) => {
      const ratio = l.size / median;
      let heading = null;
      if (ratio >= HINT.H1) heading = 1;
      else if (ratio >= HINT.H2) heading = 2;
      else if (ratio >= HINT.H3) heading = 3;

      const center = (l.leftX + l.rightX) / 2;
      const centered = l.leftX > pageWidth * 0.12 && Math.abs(center - pageWidth / 2) < pageWidth * 0.09;
      const rightAligned = !centered && l.leftX > pageWidth * 0.55;
      const indent = Math.max(0, Math.round((l.leftX - margin) / indentUnit));

      return { ...l, heading, centered, rightAligned, indent };
    });
  }

  function renderLine(l) {
    let s = "";
    if (l.indent && !l.centered && !l.rightAligned) s += "  ".repeat(Math.min(l.indent, 4));
    let text = l.text;
    if (l.italic) text = "*" + text + "*";
    if (l.heading) text = "#".repeat(l.heading) + " " + text;
    s += text;
    const tags = [];
    if (l.centered) tags.push("center");
    if (l.rightAligned) tags.push("right");
    if (l.bold && !l.heading) tags.push("bold");
    if (tags.length) s += "  \u27e8" + tags.join(",") + "\u27e9";
    return s;
  }

  async function extractPdfText(arrayBuffer, opts = {}) {
    const { onProgress } = opts;
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) throw new Error("pdf.js not loaded");
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    let totalChars = 0;

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const lines = annotate(
        buildLines(content.items, content.styles || {}, viewport.width),
        viewport.width
      );
      totalChars += lines.reduce((n, l) => n + l.text.length, 0);
      pages.push({ num: p, width: viewport.width, height: viewport.height, lines });
      if (onProgress) onProgress({ page: p, total: pdf.numPages });
    }

    const imageOnly = totalChars < 40; // basically no extractable text
    const structuredText = pages
      .map((pg) => {
        const head = `=== PAGE ${pg.num} ===`;
        const body = pg.lines.map(renderLine).join("\n");
        return head + "\n\n" + body;
      })
      .join("\n\n");

    return { pages, structuredText, stats: { pages: pdf.numPages, chars: totalChars, imageOnly } };
  }

  window.extractPdfText = extractPdfText;
})();
