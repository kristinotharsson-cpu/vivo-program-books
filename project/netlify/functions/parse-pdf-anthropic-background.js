// Netlify Background Function — long-running PDF parse.
// Returns 202 immediately; client polls parse-pdf-status for the result.
//
// POST body: { jobId: string, pdfText: string, filename?: string }
// jobId is generated client-side (UUID) so the client can poll without round-trip.
//
// Env: ANTHROPIC_API_KEY (required), PARSE_RATE_LIMIT_PER_HOUR (default 50)

const { parsePdf } = require("./lib/parsePdf");
const jobs = require("./lib/jobs");

const RATE_LIMIT = parseInt(process.env.PARSE_RATE_LIMIT_PER_HOUR || "50", 10);

exports.handler = async (event) => {
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { jobId, pdfText, filename } = body;
  if (!jobId || typeof jobId !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "jobId required" }) };
  }
  if (!pdfText || typeof pdfText !== "string") {
    await safeUpdate(jobId, { status: "failed", error: "pdfText required" });
    return { statusCode: 400, body: JSON.stringify({ error: "pdfText required" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await safeUpdate(jobId, { status: "failed", error: "ANTHROPIC_API_KEY not configured" });
    return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }) };
  }

  const ip = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";

  try {
    const used = await jobs.getRateLimit(ip);
    if (used >= RATE_LIMIT) {
      await safeUpdate(jobId, {
        status: "failed",
        error: `Rate limit reached: ${used}/${RATE_LIMIT} parses this hour. Adjust PARSE_RATE_LIMIT_PER_HOUR or wait.`,
      });
      return { statusCode: 429, body: JSON.stringify({ error: "rate-limited" }) };
    }
    await jobs.recordRateLimit(ip);

    await jobs.create(jobId, { status: "parsing", filename: filename || null, ip });

    const result = await parsePdf({
      pdfText,
      apiKey,
      onProgress: (p) => safeUpdate(jobId, { progress: p }),
    });

    await safeUpdate(jobId, {
      status: result.failure ? "review-needed" : "done",
      data: result.data,
      summary: result.summary,
      failure: result.failure || null,
      finishedAt: new Date().toISOString(),
    });
  } catch (e) {
    await safeUpdate(jobId, {
      status: "failed",
      error: e.message || String(e),
      finishedAt: new Date().toISOString(),
    });
  }

  return { statusCode: 202, body: "" };
};

async function safeUpdate(jobId, patch) {
  try { await jobs.update(jobId, patch); } catch (_) {}
}
