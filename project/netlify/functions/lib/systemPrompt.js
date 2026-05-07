const fs = require("fs");
const path = require("path");

let cached = null;

function load() {
  if (cached) return cached;
  const candidates = [
    path.join(__dirname, "..", "..", "..", "..", "parser-package", "parser_system_prompt.md"),
    path.join(process.cwd(), "parser-package", "parser_system_prompt.md"),
  ];
  for (const p of candidates) {
    try { cached = fs.readFileSync(p, "utf8"); return cached; } catch (_) {}
  }
  throw new Error("Could not locate parser_system_prompt.md");
}

module.exports = { load };
