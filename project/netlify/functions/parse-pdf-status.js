// GET /.netlify/functions/parse-pdf-status?jobId=<uuid>
// Returns the current job record from the Blobs store.

const jobs = require("./lib/jobs");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const jobId = (event.queryStringParameters || {}).jobId;
  if (!jobId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "jobId query param required" }) };
  }

  try {
    const record = await jobs.get(jobId);
    if (!record) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "job not found", jobId }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(record) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
