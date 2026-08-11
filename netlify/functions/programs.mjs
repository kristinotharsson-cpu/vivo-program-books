// Netlify Function: program storage on Netlify Blobs.
// GET  ?op=ping          -> 200 "ok"            (adapter uses this to detect Blobs mode)
// GET  ?op=list          -> { [id]: {status, updatedAt, lastExportedAt} }
// GET  ?op=reset-content&token=<RESET_TOKEN> -> clears program content, preserves photos
// GET  ?id=<slug>        -> full program record JSON | 404
// PUT  ?id=<slug>  body  -> saves record
// DELETE ?id=<slug>      -> deletes record
import { getStore } from "@netlify/blobs";

// ---- Content reset helpers ----
// Walk an object and collect every base64 data: URL at a known photo key.
function harvestPhotos(obj, path = "", out = {}) {
  if (!obj || typeof obj !== "object") return out;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const fullPath = path ? path + "." + key : key;
    if (
      (key === "photoSrc" || key === "imageSrc" || key === "thumbSrc") &&
      typeof val === "string" &&
      val.startsWith("data:")
    ) {
      out[fullPath] = val;
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => harvestPhotos(item, fullPath + "[" + i + "]", out));
    } else if (val && typeof val === "object") {
      harvestPhotos(val, fullPath, out);
    }
  }
  return out;
}

// Re-plant harvested photos back into a reset data tree by matching paths.
function plantPhotos(obj, photos, path = "") {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item, i) => plantPhotos(item, photos, path + "[" + i + "]"));
  }
  const result = {};
  for (const key of Object.keys(obj)) {
    const fullPath = path ? path + "." + key : key;
    if (
      (key === "photoSrc" || key === "imageSrc" || key === "thumbSrc") &&
      photos[fullPath]
    ) {
      result[key] = photos[fullPath];
    } else if (obj[key] && typeof obj[key] === "object") {
      result[key] = plantPhotos(obj[key], photos, fullPath);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

// Return a skeleton section that keeps structure but clears editable content.
function resetSection(sec) {
  const base = {
    id: sec.id,
    kind: sec.kind,
    title: sec.title,
    eyebrow: sec.eyebrow,
  };
  if (sec.order != null) base.order = sec.order;

  switch (sec.kind) {
    case "today-program":
      return { ...base, pieces: [], programHtml: "", sponsor: {}, header: {} };

    case "bios":
      return {
        ...base,
        photoLayout: sec.photoLayout || "thumbnail",
        bios: (sec.bios || []).map(b => ({
          id: b.id,
          name: "",
          role: "",
          photoSrc: b.photoSrc || "",
          body: [""],
          archive: { tag: "", when: "", work: "", venue: "", body: [""] },
        })),
      };

    case "info":
      return {
        ...base,
        sections: (sec.sections || []).map(s => ({
          h: s.h || "",
          body: [""],
          imageSrc: s.imageSrc || "",
        })),
      };

    case "events":
      // Keep events list and background colour; clear per-card overrides.
      return { ...base, bg: sec.bg, events: sec.events, cardColors: {}, notes: {}, thumbs: {} };

    case "cast":
      return { ...base, rows: [] };

    case "donors":
    case "supporters-list":
      return { ...base, categories: [] };

    case "promo":
      return { ...base, bg: sec.bg, items: [] };

    default:
      return base;
  }
}

function resetData(data) {
  if (!data) return data;
  const photos = harvestPhotos(data);
  const cover = data.cover || {};
  const newCover = { photoSrc: cover.photoSrc || "" };
  const newData = {
    ...data,
    cover: newCover,
    sections: (data.sections || []).map(resetSection),
  };
  return plantPhotos(newData, photos);
}

export default async (req) => {
  const store = getStore("programs");
  const url = new URL(req.url);
  const op = url.searchParams.get("op");
  const id = url.searchParams.get("id");
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  if (req.method === "GET" && op === "ping") return new Response("ok");

  // One-time content reset — clears program text while preserving uploaded photos.
  // Requires ?token matching the RESET_TOKEN env var set in Netlify.
  if (req.method === "GET" && op === "reset-content") {
    const token = url.searchParams.get("token");
    const expected = process.env.RESET_TOKEN;
    if (!expected || token !== expected) return json({ error: "unauthorized" }, 403);

    const { blobs } = await store.list();
    const results = [];
    await Promise.all(blobs.map(async (b) => {
      try {
        const rec = await store.get(b.key, { type: "json" });
        if (!rec) return;
        const cleared = { ...rec, data: resetData(rec.data), updatedAt: new Date().toISOString() };
        await store.setJSON(b.key, cleared);
        results.push({ key: b.key, id: rec.id || b.key, ok: true });
      } catch (e) {
        results.push({ key: b.key, ok: false, error: String(e) });
      }
    }));
    return json({ reset: results.length, results });
  }

  if (req.method === "GET" && op === "list") {
    const { blobs } = await store.list();
    const out = {};
    await Promise.all(blobs.map(async (b) => {
      try {
        const rec = await store.get(b.key, { type: "json" });
        if (rec) out[rec.id || b.key] = { status: rec.status, updatedAt: rec.updatedAt, lastExportedAt: rec.lastExportedAt };
      } catch (e) {}
    }));
    return json(out);
  }

  if (!id) return json({ error: "missing id" }, 400);
  const key = "program-" + id;

  if (req.method === "GET") {
    const rec = await store.get(key, { type: "json" });
    return rec ? json(rec) : json({ error: "not found" }, 404);
  }
  if (req.method === "PUT") {
    const rec = await req.json();
    await store.setJSON(key, rec);
    return json({ ok: true });
  }
  if (req.method === "DELETE") {
    await store.delete(key);
    return json({ ok: true });
  }
  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/.netlify/functions/programs" };
