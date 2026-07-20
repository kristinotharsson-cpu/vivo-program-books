// Stage 2 orchestration: send extracted PDF text to Claude, validate, retry,
// fall back to Sonnet on schema/syntax errors only (not on truncation).

const Anthropic = require("@anthropic-ai/sdk").default || require("@anthropic-ai/sdk");
const { load: loadSystemPrompt } = require("./systemPrompt");
const { buildFewShotMessages } = require("./fewshots");
const { validate, classifyFailure } = require("./validate");
const { priceFor, summarize } = require("./cost");

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";
const MAX_INPUT_CHARS = 200_000;

function tryParseJson(raw) {
  const stripped = raw.trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = (first >= 0 && last > first) ? stripped.slice(first, last + 1) : stripped;
  try { return { ok: true, data: JSON.parse(candidate) }; }
  catch (e) {
    const truncated = !candidate.trim().endsWith("}");
    return { ok: false, error: { kind: truncated ? "truncated" : "syntax", message: e.message } };
  }
}

function extractText(message) {
  return (message.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");
}

async function callClaude(client, model, messages, systemPrompt) {
  const resp = await client.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages,
  });
  return {
    model,
    text: extractText(resp),
    stopReason: resp.stop_reason,
    usage: resp.usage,
    cost: priceFor(model, resp.usage),
  };
}

// Build the conversation: few-shot turns, then the actual PDF text.
function buildMessages(pdfText, retryNote) {
  const fewShot = buildFewShotMessages();
  const userContent = retryNote
    ? `${pdfText}\n\n---\nYour previous output failed validation: ${retryNote}\nFix this and return clean JSON only.`
    : pdfText;
  return [...fewShot, { role: "user", content: userContent }];
}

async function parsePdf({ pdfText, apiKey, onProgress }) {
  if (!pdfText || pdfText.length < 50) {
    throw new Error("Extracted PDF text is empty or too short — likely an image-only PDF that needs OCR.");
  }
  if (pdfText.length > MAX_INPUT_CHARS) {
    throw new Error(`Extracted text is ${pdfText.length} chars; cap is ${MAX_INPUT_CHARS}. Split the PDF or strip non-program pages first.`);
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = loadSystemPrompt();
  const calls = [];
  let lastFailureClass = null;
  let lastErrors = [];
  let lastRawText = "";

  const attempt = async (model, retryNote) => {
    onProgress?.({ phase: "calling-model", model, attempt: calls.length + 1 });
    const messages = buildMessages(pdfText, retryNote);
    const call = await callClaude(client, model, messages, systemPrompt);
    calls.push(call);
    lastRawText = call.text;

    const parsed = tryParseJson(call.text);
    if (!parsed.ok) {
      lastFailureClass = classifyFailure({ stopReason: call.stopReason, parseError: parsed.error });
      lastErrors = [`${parsed.error.kind}: ${parsed.error.message}`];
      return { ok: false };
    }

    const v = validate(parsed.data);
    if (!v.ok) {
      lastFailureClass = classifyFailure({ stopReason: call.stopReason, validationErrors: v.errors });
      lastErrors = v.errors.slice(0, 5);
      return { ok: false, data: parsed.data };
    }

    return { ok: true, data: parsed.data };
  };

  // Attempt 1: Haiku, no retry note
  let r = await attempt(HAIKU, null);
  if (r.ok) {
    return { data: r.data, calls, summary: summarize(calls) };
  }

  // Truncation -> don't burn money on a re-call; surface for review.
  if (lastFailureClass === "truncation") {
    const data = r.data || { _meta: { programType: "voice", parserConfidence: "low", needsReview: ["truncated-output"] }, cover: {}, sections: [] };
    data._meta = data._meta || {};
    data._meta.parserConfidence = "low";
    data._meta.needsReview = Array.from(new Set([...(data._meta.needsReview || []), "truncated-output"]));
    return { data, calls, summary: summarize(calls), failure: { class: "truncation", errors: lastErrors, rawText: lastRawText } };
  }

  // Attempt 2: Haiku with retry note carrying the validation/parse error
  r = await attempt(HAIKU, lastErrors.join("; "));
  if (r.ok) return { data: r.data, calls, summary: summarize(calls) };

  // Both Haiku attempts failed. Escalate to Sonnet only for schema/syntax errors,
  // not for truncation that suddenly appeared on retry.
  if (lastFailureClass === "schema" || lastFailureClass === "syntax") {
    r = await attempt(SONNET, lastErrors.join("; "));
    if (r.ok) return { data: r.data, calls, summary: summarize(calls) };
  }

  // All paths exhausted — save with low confidence + flag.
  const data = r.data || { _meta: {}, cover: {}, sections: [] };
  data._meta = data._meta || {};
  data._meta.parserConfidence = "low";
  data._meta.needsReview = Array.from(new Set([...(data._meta.needsReview || []), "validation-failed"]));
  return {
    data,
    calls,
    summary: summarize(calls),
    failure: { class: lastFailureClass || "unknown", errors: lastErrors, rawText: lastRawText },
  };
}

module.exports = { parsePdf, MAX_INPUT_CHARS };
