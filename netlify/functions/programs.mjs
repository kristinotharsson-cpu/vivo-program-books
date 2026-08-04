// Netlify Function: program storage on Netlify Blobs.
// GET  ?op=ping          -> 200 "ok"            (adapter uses this to detect Blobs mode)
// GET  ?op=list          -> { [id]: {status, updatedAt, lastExportedAt} }
// GET  ?id=<slug>        -> full program record JSON | 404
// PUT  ?id=<slug>  body  -> saves record
// DELETE ?id=<slug>      -> deletes record
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("programs");
  const url = new URL(req.url);
  const op = url.searchParams.get("op");
  const id = url.searchParams.get("id");
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  if (req.method === "GET" && op === "ping") return new Response("ok");

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
