// Storage adapter — one interface, two backends.
// Deployed on Netlify: talks to /.netlify/functions/programs (Netlify Blobs).
// Anywhere else (this preview, local file): falls back to localStorage.
// API (all async): getProgram(id), saveProgram(id, record), listPrograms(), deleteProgram(id)
// Record shape per how_this_app_works.md: { id, shellId, createdAt, updatedAt, status, lastExportedAt, data:{cover,sections} }
(function () {
  const FN = "/.netlify/functions/programs";
  const LS_PREFIX = "vivo-program-";
  let mode = null; // "blobs" | "local"

  async function detect() {
    if (mode) return mode;
    try {
      const r = await fetch(FN + "?op=ping", { method: "GET" });
      mode = r.ok ? "blobs" : "local";
    } catch (e) { mode = "local"; }
    return mode;
  }

  const local = {
    async getProgram(id) {
      const v = localStorage.getItem(LS_PREFIX + id);
      return v ? JSON.parse(v) : null;
    },
    async saveProgram(id, record) {
      localStorage.setItem(LS_PREFIX + id, JSON.stringify(record));
      return record;
    },
    async listPrograms() {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LS_PREFIX)) {
          try {
            const r = JSON.parse(localStorage.getItem(k));
            out[r.id || k.slice(LS_PREFIX.length)] = { status: r.status, updatedAt: r.updatedAt, lastExportedAt: r.lastExportedAt };
          } catch (e) {}
        }
      }
      return out;
    },
    async deleteProgram(id) { localStorage.removeItem(LS_PREFIX + id); }
  };

  const blobs = {
    async getProgram(id) {
      const r = await fetch(FN + "?id=" + encodeURIComponent(id));
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("storage: get failed " + r.status);
      return r.json();
    },
    async saveProgram(id, record) {
      const r = await fetch(FN + "?id=" + encodeURIComponent(id), {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(record)
      });
      if (!r.ok) throw new Error("storage: save failed " + r.status);
      return record;
    },
    async listPrograms() {
      const r = await fetch(FN + "?op=list");
      if (!r.ok) throw new Error("storage: list failed " + r.status);
      return r.json(); // { [id]: {status, updatedAt, lastExportedAt} }
    },
    async deleteProgram(id) {
      await fetch(FN + "?id=" + encodeURIComponent(id), { method: "DELETE" });
    }
  };

  window.VivoStore = {
    async backend() { return detect(); },
    async getProgram(id) { return (await detect()) === "blobs" ? blobs.getProgram(id) : local.getProgram(id); },
    async saveProgram(id, rec) { return (await detect()) === "blobs" ? blobs.saveProgram(id, rec) : local.saveProgram(id, rec); },
    async listPrograms() { return (await detect()) === "blobs" ? blobs.listPrograms() : local.listPrograms(); },
    async deleteProgram(id) { return (await detect()) === "blobs" ? blobs.deleteProgram(id) : local.deleteProgram(id); },
    newRecord(id, data, status) {
      const now = new Date().toISOString();
      return { id, shellId: id, createdAt: now, updatedAt: now, status: status || "draft", lastExportedAt: null, data };
    },
    touch(rec, patch) {
      return { ...rec, ...patch, updatedAt: new Date().toISOString() };
    }
  };
})();
