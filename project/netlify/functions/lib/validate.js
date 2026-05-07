const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

let validator = null;

function load() {
  if (validator) return validator;
  // Schema lives at repo root; functions run from project/. Try both.
  const candidates = [
    path.join(__dirname, "..", "..", "..", "..", "schema", "program.schema.json"),
    path.join(__dirname, "..", "..", "..", "schema", "program.schema.json"),
    path.join(process.cwd(), "schema", "program.schema.json"),
  ];
  let schema;
  for (const p of candidates) {
    try { schema = JSON.parse(fs.readFileSync(p, "utf8")); break; } catch (_) {}
  }
  if (!schema) throw new Error("Could not locate program.schema.json");
  const ajv = new Ajv({ allErrors: true, strict: false });
  validator = ajv.compile(schema);
  return validator;
}

function validate(data) {
  const v = load();
  const ok = v(data);
  if (ok) return { ok: true, errors: [] };
  const errors = (v.errors || []).map(e => `${e.instancePath || "/"} ${e.message}${e.params ? " " + JSON.stringify(e.params) : ""}`);
  return { ok: false, errors };
}

// Classify validation failure to drive the smart-fallback decision.
//   "truncation"  — output looks cut off (max_tokens reached)
//   "syntax"      — JSON.parse failed
//   "schema"      — structurally fine JSON but doesn't match schema
function classifyFailure({ stopReason, parseError, validationErrors }) {
  if (stopReason === "max_tokens" || parseError?.kind === "truncated") return "truncation";
  if (parseError) return "syntax";
  if (validationErrors && validationErrors.length) return "schema";
  return "unknown";
}

module.exports = { validate, classifyFailure };
