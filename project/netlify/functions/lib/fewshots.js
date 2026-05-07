const fs = require("fs");
const path = require("path");

// Few-shot examples: dance + voice (covers the most schema variety).
// Orchestra and classical are described in the system prompt's schema docs only.
//
// Each example is a {user, assistant} pair injected as a conversation turn before
// the real PDF text. The user turn ideally carries the *original extracted text*
// from the sample PDF; the assistant turn carries the canonical hand-written JSON
// from samples/*.json.
//
// If parser-package/fewshot/<name>_input.txt is missing, we fall back to a
// minimal placeholder marker. The model still benefits from seeing the JSON shape,
// but real input/output pairing is stronger — populate those files when you can.

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");

function readFirst(...candidates) {
  for (const p of candidates) {
    try { return fs.readFileSync(p, "utf8"); } catch (_) {}
  }
  return null;
}

function loadExample(name, jsonName) {
  const inputText = readFirst(
    path.join(ROOT, "parser-package", "fewshot", `${name}_input.txt`),
  );
  const jsonRaw = readFirst(
    path.join(ROOT, "samples", jsonName),
  );
  if (!jsonRaw) return null;

  const userMsg = inputText
    ? inputText
    : `[Sample ${name} program book — source text not yet extracted; refer to JSON shape below as a structural example.]`;

  // Re-stringify so the assistant turn matches what we'll grade the model on.
  let assistantMsg;
  try {
    assistantMsg = JSON.stringify(JSON.parse(jsonRaw));
  } catch (_) {
    assistantMsg = jsonRaw.trim();
  }

  return [
    { role: "user", content: userMsg },
    { role: "assistant", content: assistantMsg },
  ];
}

let cached = null;
function buildFewShotMessages() {
  if (cached) return cached;
  const turns = [];
  const dance = loadExample("dance", "dance_program.json");
  const voice = loadExample("voice", "voice_program.json");
  if (dance) turns.push(...dance);
  if (voice) turns.push(...voice);
  cached = turns;
  return turns;
}

module.exports = { buildFewShotMessages };
