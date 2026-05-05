// Netlify Function — publishes a program book back to GitHub so Netlify redeploys.
// Requires GITHUB_TOKEN set in Netlify → Site configuration → Environment variables.

const OWNER = "kristinotharsson-cpu";
const REPO  = "vivo-program-books";

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

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "GITHUB_TOKEN not configured. Add it in Netlify → Site configuration → Environment variables." })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { slug, data, tweaks } = body;

  // Validate slug — alphanumeric + hyphens only, prevents path traversal
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid slug" }) };
  }

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "vivo-program-books",
  };

  // Helper: get a file's content + SHA from GitHub
  async function getFile(path) {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: ghHeaders,
    });
    if (!res.ok) return null;
    return res.json();
  }

  // Helper: create or update a file
  async function putFile(path, content, message, sha) {
    const encoded = Buffer.from(content).toString("base64");
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify({ message, content: encoded, ...(sha ? { sha } : {}) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub ${res.status}`);
    }
    return res.json();
  }

  try {
    // 1. Save the show JSON (with tweaks embedded)
    const showPath = `shows/${slug}.json`;
    const existing = await getFile(showPath);
    const showJson = JSON.stringify({ ...data, slug, _tweaks: tweaks || {} }, null, 2);
    await putFile(showPath, showJson, `Publish: ${data?.cover?.title || slug}`, existing?.sha);

    // 2. If this is a new show (no existing file), add it to manifest.json
    if (!existing && data?.cover) {
      const manifestFile = await getFile("shows/manifest.json");
      if (manifestFile) {
        const manifest = JSON.parse(Buffer.from(manifestFile.content, "base64").toString("utf8"));
        const alreadyListed = manifest.some(s => s.slug === slug);
        if (!alreadyListed) {
          manifest.push({
            slug,
            title: data.cover.title || slug,
            leadArtist: data.cover.title || slug,
            date: data.cover.date || "",
            time: data.cover.time || "",
            iso: data._meta?.iso || "",
            venue: data.cover.venue || "",
            genre: data._meta?.genre || "Other",
            tags: [],
            accent: tweaks?.coverAccent || data.cover.accent || "plum",
          });
          await putFile(
            "shows/manifest.json",
            JSON.stringify(manifest, null, 2),
            `Add to season: ${data.cover.title || slug}`,
            manifestFile.sha
          );
        }
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
