# Parser Package — How to Use This

You have three files here. Use them in this order:

## File 1: `01_audit_prompt.md`

**What it is**: A prompt to paste into Cowork **before changing anything**.
**What it does**: Asks Cowork to tell you what the existing PDF parser does — what model it calls, how many calls per parse, whether it uses vision input, etc.
**Why it matters**: We don't want to rebuild a parser that's already cheap and good. The audit tells us whether to refine or replace.

**Action**: Open Cowork, paste the contents of `01_audit_prompt.md`, hit send. Read what comes back. Paste the response back to me (the assistant you're talking to now).

---

## File 2: `parser_system_prompt.md`

**What it is**: The full system prompt for the new parser — the instructions sent to the AI on every parse call.
**What it does**: Encodes program-type detection rules, the JSON schema, translation handling, and common failure modes to avoid.
**Why it matters**: This is the brains of the parser. Tight prompts produce cheap, accurate output.

**Action**: Don't do anything with this yet. After the audit comes back and I confirm we're rebuilding the parser, this file gets dropped into the project at `src/parser/prompts/system.md`.

---

## File 3: `02_parser_implementation_spec.md`

**What it is**: The implementation spec for the new parser — architecture, model choice, cost targets, UI for single + bulk import.
**What it does**: Tells Cowork exactly what to build and why each choice was made.
**Why it matters**: With this in hand, Cowork can build the parser correctly the first time without expensive missteps.

**Action**: After the audit + my response, paste this whole spec into Cowork as the directive for the parser rebuild.

---

## Realistic timeline

- **Audit**: 5 minutes (Cowork reads existing code and answers)
- **Decision (you + me)**: 10-15 minutes (we read the audit, decide refine vs replace)
- **Build**: 1-3 hours of Cowork work, depending on what's already there
- **Test against 4 known PDFs**: 30 minutes
- **Bulk import the 80-program backlog**: 1-2 hours of wall-clock time, ~$5-10 in API costs

## Realistic cost

For 80 programs at 8 pages each, using Haiku 4.5 with the prompt and architecture in this package:
- **Bulk import (one-time)**: roughly $3-8
- **Ongoing parsing of new programs**: pennies per program, under $5/year for a busy season

The previous "too expensive" experience was almost certainly the implementation, not the API. We'll know for sure once the audit comes back.
