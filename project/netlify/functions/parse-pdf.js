// Netlify Function — parses extracted PDF text into program book JSON via Gemini API.
// Requires GEMINI_API_KEY set in Netlify → Site configuration → Environment variables.
// Get a free key at https://aistudio.google.com (free tier: 1,500 req/day, no credit card).

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "GEMINI_API_KEY not configured in Netlify environment variables." }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { text } = body;
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "text is required" }) };
  }

  const SCHEMA = `
The JSON must have this top-level shape:
{
  "cover": {
    "eyebrow": string,        // presenter / series name (e.g. "Vivo Performing Arts Presents")
    "title": string,          // main artist / company name (ALL CAPS as printed)
    "subtitle": string,       // instrument or company type (optional)
    "date": string,           // date range as printed (e.g. "APR 30 – MAY 3, 2026")
    "time": string,           // show time if single performance (optional)
    "venue": string           // venue name
  },
  "sections": [ ...SectionObject ]
}

Each SectionObject has: { "id": string (slug), "title": string, "kind": string, ...kind-specific fields }

SECTION KINDS:

kind "cast" — company members, cast, and creative/artistic leadership
{
  "eyebrow": string,
  "cast": [ { "role": string, "name": string } ],   // performers / company members (put all company members here, one per entry)
  "creative": [ { "role": string, "name": string } ] // directors, designers, production staff
}
For large dance companies, list ALL company members in "cast" with role "Company Member" (or their specific role if given).
Named artistic leaders (Artistic Director, Executive Director, etc.) go in "creative".

kind "program" — the running order / dance pieces
{
  "eyebrow": string,
  "lead": string,   // optional intro
  "pieces": [
    {
      "title": string,          // piece/dance title (ALL CAPS as printed or mixed if source is mixed)
      "year": string,           // year in parens if present
      "meta": string,           // parenthetical like "(Company Premiere 2025)" — optional
      "credits": [              // list of credit lines
        { "role": string, "name": string }
      ],
      "description": string,    // descriptive paragraph if present — optional
      "note": string,           // italicized support/dedication note — optional
      "musicCredits": string,   // music licensing credits paragraph — optional
      "sections": [             // sub-sections within a piece (e.g. PILGRIM OF SORROW, TAKE ME TO THE WATER)
        {
          "h": string,
          "items": [ { "title": string, "meta": string } ]
        }
      ]
    },
    { "kind": "intermission", "label": "INTERMISSION" },  // for intermission/pause markers
    { "kind": "pause", "label": "PAUSE" }
  ]
}

kind "notes" — about the company, about the program, program notes
{
  "eyebrow": string,
  "lead": string,
  "sections": [
    { "h": string, "body": [ string ] }
  ],
  "callout": {                  // optional highlighted/boxed callout (e.g. "From the Vivo archives...")
    "label": string,
    "body": [ string ]
  },
  "closing": string             // optional closing acknowledgment paragraph
}

kind "bios" — artist biographies
{
  "eyebrow": string,
  "bios": [
    { "id": string, "name": string, "role": string, "initials": string, "photoSrc": "", "body": [ string ] }
  ]
}

kind "performance-sponsor" — sponsors and support acknowledgments
{
  "eyebrow": string,
  "lead": string,
  "blocks": [
    { "label": string, "name": string, "statement": string }
  ],
  "seasonSponsorsLabel": string,
  "seasonSponsors": string,
  "publicSupport": string,      // "Organization is supported by the Mass Cultural Council..." etc
  "closing": string
}

kind "donors" — tiered donor lists
{
  "eyebrow": string,
  "lead": string,
  "tiers": [
    { "name": string, "names": [ string ] }
  ],
  "footer": string
}

kind "roster" — board of directors, staff, musicians (grouped lists)
{
  "eyebrow": string,
  "lead": string,
  "groups": [
    { "h": string, "players": [ string ] }
  ]
}

kind "info" — house info, land acknowledgment, accessibility, contact
{
  "eyebrow": string,
  "sections": [ { "h": string, "body": [ string ] } ]
}

kind "events" — upcoming events / season listings
{
  "eyebrow": string,
  "lead": string,
  "events": [ { "month": string, "day": string, "title": string, "meta": string } ]
}

kind "welcome" — letter from artistic/executive director
{
  "eyebrow": string,
  "quote": string,
  "body": [ string ],
  "signature": { "name": string, "role": string }
}
`;

  const prompt = `You are parsing a performing arts printed program book into structured JSON for a digital program book platform.

Extract ALL content from the PDF text below and map it into the JSON schema provided. Do not invent or embellish content — only use what is explicitly in the text.

SCHEMA:
${SCHEMA}

IMPORTANT RULES:
- Every piece of text content should end up somewhere in the JSON.
- For dance/company programs: company members go in a "cast" section. Artistic leadership (Artistic Director, Executive Director, etc.) go in "creative" within the same cast section.
- For the dance program pieces: each titled work (e.g. THE HOLY BLUES, BLINK OF AN EYE) is one piece object in the "program" section's pieces array. Include ALL credits listed.
- Sub-programs within a piece (like PILGRIM OF SORROW / TAKE ME TO THE WATER) go in that piece's "sections" array with their song listings.
- Music licensing credits (song copyright lines) go in "musicCredits" on the piece.
- Sponsor acknowledgments go in a "performance-sponsor" section.
- "About the Company" text goes in a "notes" section.
- "From the Vivo archives" or similar boxed/highlighted callout goes in that notes section's "callout" field.
- INTERMISSION and PAUSE markers in the program become { "kind": "intermission" } or { "kind": "pause" } objects in the pieces array.
- Season/series labels like "2025/26 Season" at the bottom of a page are footers and can go in closing or publicSupport of the nearest sponsor section.
- If content from the program book doesn't fit any section kind perfectly, choose the closest match.
- Generate short, unique IDs (slugs) for each section: e.g. "company", "program", "about", "sponsors", "donors".

Return ONLY valid JSON — no markdown, no explanation, no code fences. Start with { and end with }.

PDF TEXT:
${text.slice(0, 50000)}`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error ${res.status}`);
    }

    const apiResp = await res.json();
    const rawText = apiResp.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error("Claude returned invalid JSON: " + e.message);
    }

    if (!parsed.cover || !parsed.sections) {
      throw new Error("Parsed JSON missing cover or sections");
    }

    return { statusCode: 200, headers, body: JSON.stringify({ data: parsed }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
