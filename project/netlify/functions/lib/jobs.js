const { getStore } = require("@netlify/blobs");

const STORE_NAME = "pdf-parse-jobs";

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

async function create(jobId, initial) {
  const record = {
    jobId,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...initial,
  };
  await store().setJSON(jobId, record);
  return record;
}

async function get(jobId) {
  return await store().get(jobId, { type: "json" });
}

async function update(jobId, patch) {
  const cur = (await get(jobId)) || { jobId };
  const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  await store().setJSON(jobId, next);
  return next;
}

async function recordRateLimit(ip) {
  const key = `rl:${ip}:${Math.floor(Date.now() / 3.6e6)}`; // hour bucket
  const cur = (await store().get(key, { type: "json" })) || { count: 0 };
  cur.count += 1;
  await store().setJSON(key, cur);
  return cur.count;
}

async function getRateLimit(ip) {
  const key = `rl:${ip}:${Math.floor(Date.now() / 3.6e6)}`;
  const cur = await store().get(key, { type: "json" });
  return cur?.count || 0;
}

module.exports = { create, get, update, recordRateLimit, getRateLimit };
