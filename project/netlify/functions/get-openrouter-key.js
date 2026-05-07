// Returns the OpenRouter API key to the client so it can call the API directly.
// This avoids Netlify function timeouts (free models can take 15-30s).
// The key is free-tier only, so exposure is low-risk.
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "OPENROUTER_API_KEY not configured. Get a free key at openrouter.ai and add it to Netlify environment variables." }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify({ key }) };
};
