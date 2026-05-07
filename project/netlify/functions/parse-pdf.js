// Netlify Function — parses extracted PDF text into program book JSON via Groq API.
// Requires GROQ_API_KEY set in Netlify → Site configuration → Environment variables.
// Get a free key at https://console.groq.com (free tier, no credit card required).

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "GROQ_API_KEY not configured in Netlify environment variables." }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { text } = body;
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "text is required" }) };
  }

  const prompt = `Parse this performing arts program book into JSON. Return ONLY valid JSON, no markdown, no explanation.

OUTPUT SHAPE:
{"cover":{"eyebrow":"","title":"","subtitle":"","date":"","time":"","venue":""},"sections":[...]}

Each section: {"id":"slug","title":"","kind":"KIND",...fields}

KINDS and their extra fields:
cast: eyebrow, cast:[{role,name}], creative:[{role,name}]
program: eyebrow, lead, pieces:[{title,year,meta,credits:[{role,name}],description,note,musicCredits,sections:[{h,items:[{title,meta}]}]}] — use {kind:"intermission",label:"INTERMISSION"} or {kind:"pause",label:"PAUSE"} for breaks
notes: eyebrow, lead, sections:[{h,body:[str]}], callout:{label,body:[str]}, closing
bios: eyebrow, bios:[{id,name,role,initials,photoSrc:"",body:[str]}]
performance-sponsor: eyebrow, lead, blocks:[{label,name,statement}], seasonSponsorsLabel, seasonSponsors, publicSupport, closing
donors: eyebrow, lead, tiers:[{name,names:[str]}], footer
roster: eyebrow, lead, groups:[{h,players:[str]}]
info: eyebrow, sections:[{h,body:[str]}]
events: eyebrow, lead, events:[{month,day,title,meta}]
welcome: eyebrow, quote, body:[str], signature:{name,role}

RULES:
- Company members → cast[]. Artistic/Executive Directors → creative[].
- Each dance work = one piece object with all its credits.
- Sub-songs within a piece → that piece's sections[].
- Music copyright lines → musicCredits on the piece.
- About the company → notes section.
- Boxed/highlighted callout → notes.callout.
- Sponsors → performance-sponsor section.
- Season footer labels → publicSupport or closing of sponsor section.

PDF TEXT:
${text.slice(0, 14000)}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    const apiResp = await res.json();
    if (!res.ok) throw new Error(apiResp.error?.message || `Groq API error ${res.status}`);

    const rawText = apiResp.choices?.[0]?.message?.content || "";
    if (!rawText) throw new Error("Groq returned no content");

    const cleaned = rawText.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error("Model returned invalid JSON: " + e.message);
    }

    if (!parsed.cover || !parsed.sections) {
      throw new Error("Parsed JSON missing cover or sections");
    }

    return { statusCode: 200, headers, body: JSON.stringify({ data: parsed }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
