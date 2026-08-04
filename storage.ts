import type { ProgramRecord, VivoStoreAPI } from './types.js';

// Storage adapter — one interface, two backends.
// Deployed on Netlify: talks to /.netlify/functions/programs (Netlify Blobs).
// Anywhere else (this preview, local file): falls back to localStorage.
// API (all async): getProgram(id), saveProgram(id, record), listPrograms(), deleteProgram(id)
// Record shape per how_this_app_works.md: { id, shellId, createdAt, updatedAt, status, lastExportedAt, data:{cover,sections} }
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

  // Local backend: IndexedDB (megabytes of quota — holds base64 photos that overflow
  // localStorage's ~5MB cap). Falls back to localStorage only if IndexedDB is unavailable.
  const IDB_NAME = "vivo-programs", IDB_STORE = "records";
  let _db = null;
  function idb() {
    if (_db) return _db;
    _db = new Promise((resolve, reject) => {
      let req;
      try { req = indexedDB.open(IDB_NAME, 1); } catch (e) { return reject(e); }
      req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return _db;
  }
  function idbReq(store, mode, fn) {
    return idb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, mode);
      const rq = fn(tx.objectStore(IDB_STORE));
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    }));
  }
  const hasIDB = (function () { try { return !!window.indexedDB; } catch (e) { return false; } })();

  const local = {
    async getProgram(id) {
      if (hasIDB) {
        try { const v = await idbReq(IDB_STORE, "readonly", st => st.get(id)); if (v) return v; } catch (e) {}
      }
      const v = localStorage.getItem(LS_PREFIX + id);
      return v ? JSON.parse(v) : null;
    },
    async saveProgram(id, record) {
      if (hasIDB) {
        try { await idbReq(IDB_STORE, "readwrite", st => st.put(record, id)); return record; } catch (e) {}
      }
      try { localStorage.setItem(LS_PREFIX + id, JSON.stringify(record)); } catch (e) { console.warn("VivoStore local save failed (quota)", e); }
      return record;
    },
    async listPrograms() {
      const out = {};
      if (hasIDB) {
        try {
          const keys = await idbReq(IDB_STORE, "readonly", st => st.getAllKeys());
          const vals = await idbReq(IDB_STORE, "readonly", st => st.getAll());
          keys.forEach((k, i) => { const r = vals[i] || {}; out[r.id || k] = { status: r.status, updatedAt: r.updatedAt, lastExportedAt: r.lastExportedAt }; });
          return out;
        } catch (e) {}
      }
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
    async deleteProgram(id) {
      if (hasIDB) { try { await idbReq(IDB_STORE, "readwrite", st => st.delete(id)); } catch (e) {} }
      localStorage.removeItem(LS_PREFIX + id);
    }
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

export const VivoStore: VivoStoreAPI = {
    async backend() { return detect(); },
    async getProgram(id: string): Promise<ProgramRecord | null> { return (await detect()) === "blobs" ? blobs.getProgram(id) : local.getProgram(id); },
    async saveProgram(id: string, rec: ProgramRecord): Promise<ProgramRecord> { return (await detect()) === "blobs" ? blobs.saveProgram(id, rec) : local.saveProgram(id, rec); },
    async listPrograms(): Promise<Record<string, { status: string; updatedAt: string; lastExportedAt?: string | null }>> { return (await detect()) === "blobs" ? blobs.listPrograms() : local.listPrograms(); },
    async deleteProgram(id: string): Promise<void> { return (await detect()) === "blobs" ? blobs.deleteProgram(id) : local.deleteProgram(id); },
    newRecord(id, data, status) {
      const now = new Date().toISOString();
      return { id, shellId: id, createdAt: now, updatedAt: now, status: status || "draft", lastExportedAt: null, data };
    },
    touch(rec, patch) {
      return { ...rec, ...patch, updatedAt: new Date().toISOString() };
    },
    // ---- Shared supporters, versioned by effective date ----
    // An edit made on a program dated D applies to that program and every later-dated
    // program, but never to programs dated before D.
    SHARED_KEY: "vivo-shared-data",
    parseDate(str) {
      if (!str) return null;
      var m = String(str).match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
      if (m) { var d = Date.parse(m[1] + " " + m[2] + ", " + m[3]); if (!isNaN(d)) return d; }
      var d2 = Date.parse(str); return isNaN(d2) ? null : d2;
    },
    _readShared() { try { var v = localStorage.getItem(this.SHARED_KEY); return v ? JSON.parse(v) : {}; } catch (e) { return {}; } },
    _writeShared(o) { try { localStorage.setItem(this.SHARED_KEY, JSON.stringify(o)); } catch (e) {} },
    // Pull shared-content versions from Blobs into localStorage — call once at boot.
    async loadSharedFromBlobs() {
      if ((await detect()) !== "blobs") return;
      try {
        const r = await fetch(FN + "?id=__shared");
        if (r.ok) { const remote = await r.json(); this._writeShared(remote); }
      } catch (e) {}
    },
    // Push the current shared-content object to Blobs — fire-and-forget after any saveVersion.
    async flushSharedToBlobs() {
      if ((await detect()) !== "blobs") return;
      try {
        await fetch(FN + "?id=__shared", {
          method: "PUT", headers: { "content-type": "application/json" },
          body: JSON.stringify(this._readShared())
        });
      } catch (e) {}
    },
    // Generic date-versioned shared value under any key (e.g. "supporters", "staffBoard").
    getVersions(key) { var o = this._readShared(); var vk = key + "Versions"; return Array.isArray(o[vk]) ? o[vk] : []; },
    saveVersion(key, fromNum, value) {
      if (fromNum == null) fromNum = 0;
      var o = this._readShared(); var vk = key + "Versions";
      var vers = (Array.isArray(o[vk]) ? o[vk] : []).filter(function (v) { return v.from !== fromNum; });
      vers.push({ from: fromNum, value: value });
      vers.sort(function (a, b) { return a.from - b.from; });
      o[vk] = vers; this._writeShared(o);
      this.flushSharedToBlobs(); // fire-and-forget cross-machine sync
    },
    resolveVersion(key, def, dateNum) {
      if (dateNum == null) return def;
      var vers = this.getVersions(key), best = null;
      for (var i = 0; i < vers.length; i++) { var v = vers[i]; if (v.from <= dateNum && (!best || v.from > best.from)) best = v; }
      return best ? best.value : def;
    },
    // Supporters wrappers (kept for the existing boot-loader/section calls).
    getSupportersVersions() { return this.getVersions("supporters").map(function (v) { return { from: v.from, supporters: v.value }; }); },
    saveSupportersVersion(fromNum, supporters) { this.saveVersion("supporters", fromNum, supporters); },
    resolveSupporters(defaultSup, dateNum) { return this.resolveVersion("supporters", defaultSup, dateNum); }
  };
