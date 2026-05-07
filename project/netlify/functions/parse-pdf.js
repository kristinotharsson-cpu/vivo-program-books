// Netlify Function — parses one chunk of PDF text into program book JSON.
// Uses OpenRouter free tier (no billing required).
// Get a free key at https://openrouter.ai → Keys → Create API Key
// Add it to Netlify → Site configuration → Environment variables as OPENROUTER_API_KEY

const MODEL = "openrouter/free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SCHEMA = `OUTPUT: valid JSON only, no markdown.
{"cover":{"eyebrow":"","title":"","subtitle":"","date":"","time":"","venue":""},"sections":[...]}
Each section: {"id":"slug","title":"","kind":"KIND",...fields}
KINDS:
cast: eyebrow, cast:[{role,name}], creative:[{role,name}]
program: eyebrow, lead, pieces:[{title,year,meta,credits:[{role,name}],description,note,musicCredits,sections:[{h,items:[{title,meta}]}]}] — use {kind:"intermission",label:"INTERMISSION"} for breaks
notes: eyebrow, lead, sections:[{h,body:[str]}], callout:{label,body:[str]}, closing
bios: eyebrow, bios:[{id,name,role,initials,photoSrc:"",body:[str]}]
performance-sponsor: eyebrow, lead, blocks:[{label,name,statement}], seasonSponsorsLabel, seasonSponsors, publicSupport, closing
donors: eyebrow, lead, tiers:[{name,names:[str]}], footer
roster: eyebrow, lead, groups:[{h,players:[str]}]
info: eyebrow, sections:[{h,body:[str]}]
events: eyebrow, lead, events:[{month,day,title,meta}]
welcome: eyebrow, quote, body:[str], signature:{name,role}`;

const RULES = `RULES: Company members→cast[]. Directors/leaders→creative[]. Each dance work=one piece with all credits. Sub-songs→piece.sections[]. Music copyrights→musicCredits. About company→notes. Boxed callout→notes.callout. Sponsors→performance-sponsor.`;

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "OPENROUTER_API_KEY not configured. Get a free key at openrouter.ai and add it to Netlify environment variables." }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { text, isFirst } = body;
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "text is required" }) };
  }

  const prompt = isFirst
    ? `Parse this performing arts program book into JSON.\n${SCHEMA}\n${RULES}\nPDF TEXT:\n${text}`
    : `Extract content from this continuation of the same program book. Return JSON with same structure — only include what appears in THIS text.\n${SCHEMA}\nTEXT:\n${text}`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://vivo-program-books.netlify.app",
        "X-Title": "Vivo Program Books",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    const apiResp = await res.json();
    if (!res.ok) throw new Error(apiResp.error?.message || `API error ${res.status}`);

    const rawText = apiResp.choices?.[0]?.message?.content || "";
    if (!rawText) throw new Error("Model returned no content");

    const cleaned = rawText.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch (e) { throw new Error("Model returned invalid JSON: " + e.message); }

    if (isFirst && (!parsed.cover || !parsed.sections)) {
      throw new Error("Parsed JSON missing cover or sections");
    }

    return { statusCode: 200, headers, body: JSON.stringify({ data: parsed }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
