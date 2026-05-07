# PDF Parser — Implementation Spec

This is the spec for the new (or refactored) PDF-to-JSON parser. Hand this to Cowork after the audit comes back.

---

## Goal

Convert performing arts program book PDFs into validated JSON matching the existing schema (see `samples/*.json`). Cost: under $0.05 per program at typical 8-page length. Quality: 80%+ of programs parse cleanly with no human edits needed; the rest open in the editor for quick fixes.

## Architecture — three stages

### Stage 1: Extract text from PDF (no API call)

Use `pdfjs-dist` (already in the project, browser-compatible) to extract text content. For each page, capture:

- Plain text content
- Font size hints per text run (helps detect headings)
- Bold/italic style hints
- Approximate position (left/center/right alignment)
- Page number

Concatenate into a single structured input for stage 2. Don't send page images — text + style hints are enough and 5-10x cheaper than vision input.

If the PDF appears to be image-only (scanned, no extractable text), fall back to OCR (use `tesseract.js` browser-side or skip with a clear error). This case should be rare for InDesign-produced program books.

### Stage 2: Send to LLM for semantic parsing (one API call)

**Model**: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`). Use Sonnet 4.6 (`claude-sonnet-4-6`) only as a fallback if Haiku output fails validation twice.

**Single API call per PDF.** No chunking unless the input exceeds 100K tokens (vanishingly rare for 8-page programs).

**Request shape**:

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    system: PARSER_SYSTEM_PROMPT,           // the full prompt from parser_system_prompt.md
    messages: [
      // few-shot turn 1
      { role: "user", content: FEW_SHOT_DANCE_INPUT },
      { role: "assistant", content: FEW_SHOT_DANCE_OUTPUT },
      // few-shot turn 2
      { role: "user", content: FEW_SHOT_VOICE_INPUT },
      { role: "assistant", content: FEW_SHOT_VOICE_OUTPUT },
      // the actual parse
      { role: "user", content: extractedText }
    ]
  })
});
```

Pick two of the four samples as few-shots (dance + voice cover the most schema variety). Skip the other two to save tokens — the system prompt's schema documentation covers them.

### Stage 3: Validate output

Run the parsed JSON through a JSON Schema validator (use `ajv` — already a common React dep). The schema should enforce:

- `_meta.programType` is one of the four allowed values
- `cover` has required fields
- Every section has a valid `kind`
- `program` sections have `displayStyle`
- `pieces[]` items match the shape for their `displayStyle`
- Etc.

On validation failure:

1. Log what failed
2. Retry **once** with the validation error appended to the message ("Your previous output failed validation: [error]. Fix this and return clean JSON.")
3. If second attempt fails, mark `_meta.parserConfidence: "low"` and `_meta.needsReview: ["validation-failed"]`, save what you have, and surface the failure in the import UI

Do not retry beyond 2 attempts. Each retry costs money.

## UI — the import flow

A new page or modal in the editor: `/import` or "Import from PDF" button.

```
┌─────────────────────────────────────────────────┐
│  Import Program from PDF                         │
│                                                  │
│  [ Drop PDF here  or  Click to browse ]          │
│                                                  │
│  Recently imported:                              │
│  ✓ Ailey 2026                  high confidence   │
│  ✓ Bell + Wosner 2026          high              │
│  ⚠ Schubertiade 2026           medium · review   │
│  ✗ Tenebrae 2026               failed · retry    │
└─────────────────────────────────────────────────┘
```

When a PDF is dropped:

1. Show a progress indicator
2. Run stages 1-3
3. On success: open the parsed program in the editor in a "review" state, with `_meta.needsReview` flags surfaced as banners on the relevant sections
4. On failure: show what went wrong, offer a retry button with Sonnet, or a "edit raw JSON" escape hatch

## Bulk import (for the 80-program backlog)

A separate flow: `/import/bulk`

```
┌─────────────────────────────────────────────────┐
│  Bulk Import — drop a folder of PDFs             │
│                                                  │
│  Queue:                                          │
│  ⏳ ailey_2026.pdf      parsing...               │
│  ✓ bell_wosner_2026.pdf  done · review pending   │
│  ✓ orchestra_2026.pdf    done · ready to publish │
│  ⏳ schubertiade.pdf    parsing...               │
│  ⚠ tenebrae.pdf         failed · click to retry  │
│                                                  │
│  Concurrency: 3 parallel                         │
│  Estimated total cost: $2.40                     │
│  Total parsed: 12/80                             │
└─────────────────────────────────────────────────┘
```

Run 3 parses concurrently to keep wall-clock time reasonable for 80 PDFs. Show running cost based on token usage. Show per-program status. Failed parses go into a separate "needs attention" list at the end.

## Cost tracking

Log every API call's input + output tokens. Show:

- Per-program cost in the import UI
- Running total across all imports
- A monthly summary in admin settings

This makes the actual cost visible — no surprises, no "wait, we're spending what?"

## Error handling

| Failure | Response |
|---|---|
| PDF has no extractable text | Offer OCR fallback, or fail with clear message |
| API rate-limited | Queue and retry with exponential backoff |
| API key invalid | Surface clearly in admin settings, don't retry |
| JSON validation fails twice | Save with `needsReview`, open in editor |
| Network error mid-parse | Single retry, then save partial state |
| Output exceeds max_tokens | Mark needsReview, retry with higher cap |

## Files to create / modify

```
src/
├── parser/
│   ├── extractText.ts         # Stage 1: PDF.js text extraction with style hints
│   ├── parsePdf.ts            # Stage 2: API call orchestration
│   ├── validateOutput.ts      # Stage 3: JSON Schema validation
│   ├── prompts/
│   │   ├── system.md          # The parser system prompt (from parser_system_prompt.md)
│   │   ├── fewshots.ts        # Loaded examples from samples/
│   │   └── retryPrompt.ts     # Validation-failure retry message
│   └── costTracking.ts        # Log token usage + dollar cost
├── routes/
│   ├── import.tsx             # Single-PDF import page
│   └── importBulk.tsx         # Bulk import page
└── components/
    └── ImportPreview.tsx       # Review + fix UI for parsed JSON
schema/
└── program.schema.json         # JSON Schema for ajv validation
```

## What to remove / replace

If the existing parser uses:
- A more expensive model (Opus, Sonnet) by default → switch default to Haiku
- Vision input on PDF pages → switch to text extraction
- Multiple chunked API calls per PDF → consolidate to one
- Heavy retry loops → cap at 1 retry with validation-error context
- No few-shot examples → add the 2 samples from the few-shot block above

## Acceptance criteria

1. A typical 8-page program parses in under 15 seconds
2. Cost per parse is under $0.05 at Haiku rates (verified via cost log)
3. Output validates against `schema/program.schema.json` without manual fixup on at least 4/5 typical programs
4. The four sample PDFs (matching the four sample JSONs we already have) parse to JSON that's structurally identical to the hand-written samples — modulo whitespace and field ordering
5. Bulk-importing 10 PDFs at once completes in under 3 minutes total
6. Failed parses surface clearly in the UI with a retry option, never silently corrupt data
7. Cost tracking shows per-program and running-total dollar figures

## Test plan

1. Run the parser on the 4 PDFs that produced the sample JSONs already in `samples/`
2. Compare output to the hand-written samples — they should be near-identical
3. If output diverges meaningfully, refine the system prompt (not the validation, not the schema)
4. Once the 4 known-good cases pass, try 5-10 unfamiliar program PDFs from the backlog
5. Track failure modes — those become improvements to the system prompt over time

## What NOT to do

- Don't use Opus for parsing. Massive overspend for structured extraction.
- Don't send page images unless text extraction genuinely fails (rare with InDesign PDFs).
- Don't retry indefinitely on failure — cap at 1 retry and surface the failure.
- Don't try to also extract photos from the PDF in this pass. Photos are a separate workflow.
- Don't auto-publish parsed programs. Always go through the review UI first.
- Don't rebuild the editor — the parser hands off to the existing editor for review.
