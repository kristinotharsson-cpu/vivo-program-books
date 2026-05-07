# Build a Digital Program Book Template System

## Goal

Build a web-based rendering system that turns parsed program JSON into digital program pages with visual fidelity to printed performing arts programs. Vivo Performing Arts publishes four distinct program types — **dance**, **voice/vocal**, **orchestra**, and **classical/chamber** — each with its own layout conventions. One template engine should handle all four cleanly, plus support **multiple display modes for translations** in voice programs.

The output must use the **existing app dark theme** (black background, cream text). Do not invert to a light/cream-paper aesthetic — even though the print PDFs use cream paper, the web app is dark-themed and this template inherits that. The screenshots in `samples/screenshots/` show the print versions on cream paper for layout reference; the web rendering must transpose those layouts onto the dark theme.

---

## Inputs you have

In `samples/`:

| File | Description |
|---|---|
| `dance_program.json` | Parsed Ailey dance program — 32 dancers, 5 dance works split into Program A and Program B, multiple intermissions, sub-sectioned suite "Revelations" |
| `voice_program.json` | Parsed Ruckus + Davóne Tines voice program — four-Part work list, performer roster, mission callout, extensive song-text notes |
| `orchestra_program.json` | Parsed Chicago Symphony program — Beethoven 7 + Berlioz Symphonie fantastique with movements, long-form prose program notes including a nested "composer's own program note" |
| `classical_program.json` | Parsed Joshua Bell + Shai Wosner chamber recital — four sonatas with movements, prose notes, artist bios |
| `translation_example.json` | Sample fragments showing all six translation display modes with real repertoire (Schubert, Handel, Bach, Mahler, Foster) |

In `samples/screenshots/` — visual reference for layouts. **These are PRINT screenshots on cream paper; transpose the layouts onto the dark theme.**

| Screenshot | Shows |
|---|---|
| `dance_cover.png` | Dance program cover: date/venue, company name in display caps, founder/director hierarchy, three-column dancer roster, sponsor block at foot |
| `dance_piece.png` | Dance piece page: header info-block (dates, run time, theatrical haze warning) followed by a centered piece (THE HOLY BLUES) with title, year, credits stack, two pull-quotes, production support note, music credits, INTERMISSION marker |
| `dance_subsections.png` | Dance piece with sub-sections: Revelations (1960) followed by three suite movements (PILGRIM OF SORROW, TAKE ME TO THE WATER, MOVE, MEMBERS, MOVE) each with their constituent songs and arrangers |
| `voice_works.png` | Voice work-list page: tabular two-column (work title left, composer right) grouped by **PART I** through **PART IV**, with one indented sub-listing under "Federal Nations" |
| `voice_song_texts.png` | Voice notes page: each piece gets a bold title with year, attribution lines, prose program note, then **lyrics as stanzas in plain prose blocks**. This is the layout your `SongTextBlock` will mirror — just with translation column added when present |
| `orchestra_works.png` | Orchestra work-list page: tabular two-column (composer left bold, work right with movements indented), INTERMISSION centered between works |
| `orchestra_notes.png` | Orchestra long-form prose program notes (shown inside Acrobat — **ignore the app chrome**, look at the document content): bold composer/work header, multi-paragraph essay flowing as readable prose |
| `classical_works.png` | Classical chamber work-list: same tabular layout as orchestra (composer/work/movements), INTERMISSION centered, with *italicized* tempo markings (Scherzo, Blues, Perpetuum mobile) |
| `classical_notes.png` | Classical prose notes: same flowing-prose style as orchestra but for chamber works, italicizing musical terms inline (*scherzo*, *Andantino*, *Eine Kleine Nachtmusik*) |

If something in the JSON conflicts with what's in a screenshot, the JSON wins — the screenshots are visual reference, not authoritative content.

---

## Layout conventions to preserve

### Dance — centered style

See `dance_cover.png`, `dance_piece.png`, `dance_subsections.png`.

- Piece title in italic serif caps, centered, large (e.g. *THE HOLY BLUES*, *REVELATIONS*)
- `(year)` on its own line below the title in regular weight
- Credits stacked centered, one per line: role label in **bold**, name in regular weight (`**Choreographer** Alvin Ailey`)
- Description / pull-quotes as centered italic prose with attribution lines (e.g. quotes from Alvin Ailey, James Baldwin in `dance_piece.png`)
- `note` (production support) in italic, smaller, centered
- `musicCredits` in fine print at the bottom of the piece, justified, full width
- Sub-sections within a piece (Revelations' "Pilgrim of Sorrow" / "Take Me to the Water" / "Move, Members, Move" in `dance_subsections.png`): bold uppercase header, items centered below with title in **bold** and meta in italic
- Intermissions / pauses: centered uppercase label with generous vertical breathing room above and below
- The dance program also has a **header info-block** before the first piece (visible in `dance_piece.png`) — show dates, run time, theatrical haze warning, QR direction. Render this as an inverted/accented panel since the rest of the page is the standard dark theme.

### Orchestra & Classical — tabular style

See `orchestra_works.png`, `classical_works.png`, `orchestra_notes.png`, `classical_notes.png`.

- Two-column row per work: **left** = composer name (bold), **right** = work title with movements indented beneath
- Movement names hang on indented lines; tempo markings (Allegro, Andantino, etc.) — use italics specifically for non-tempo terms (Scherzo, Blues, Perpetuum mobile in `classical_works.png`) and roman for ordinary tempo words
- Intermissions span both columns, centered uppercase
- Program notes section (`orchestra_notes.png`, `classical_notes.png`) is full-width prose with a bold composer name + bold work title heading per essay
- Long quoted passages indent (see Goethe quote at top of `orchestra_notes.png`)
- Inline italicization for musical terms and titles (*scherzo*, *Andantino*, *Eine Kleine Nachtmusik* in `classical_notes.png`)
- Supports **nested sub-sections** — e.g. Berlioz's own program note is embedded inside the Berlioz essay as a clearly subordinate block (smaller heading, indented or visually offset)
- Trailing artist bios (classical only): bold name + small-caps instrument label, then prose body

### Voice — hybrid

See `voice_works.png`, `voice_song_texts.png`.

- Top: tabular work/composer list **grouped by PART I, PART II, PART III, PART IV** — each Part is a labeled group with bold uppercase heading, work titles left, composer/arranger right
- Indented sub-items (e.g. "The Federal Overture" under "Federal Nations" in `voice_works.png`) hang one indent deeper
- Performer roster block: ensemble name bold (e.g. "Ruckus"), then indented player lines (`Name — instrument/role`), bonus single-line collaborators below
- Production credits in smaller text below the roster
- Dark-toned callout block with centered title + statement (mission/dedication). Since the page is already dark, this should be a **slightly lighter or accented panel** — reverse the technique from the print version (which used dark on cream)
- "Notes on Musical Sources & Song Texts" section (`voice_song_texts.png`): each entry has a bold title + year, attribution lines, prose program note, then lyrics in stanzas. **The renderer must support replacing those plain-prose lyric blocks with the translation-aware `SongTextBlock` when translation data is present.**

---

## Translation support — multiple display modes

Voice programs frequently include foreign-language texts (German lieder, Italian arias, French mélodie, Latin liturgical works). One display layout doesn't fit every case, so the schema supports **six display modes**, and the renderer must implement all of them. See `translation_example.json` for working samples of each.

### Schema shape

```jsonc
{
  "kind": "song-text",
  "displayMode": "side-by-side",       // see modes below
  "originalLanguage": "de",            // BCP-47 code
  "translator": "Richard Wigmore",     // optional caption
  "stanzas": [
    {
      "original": "Wer reitet so spät durch Nacht und Wind?\n...",
      "translation": "Who rides so late through the night and wind?\n...",
      "speaker": "Erl-King",           // optional, for opera/oratorio multi-voice
      "isChorus": false                // optional, indents + italicizes
    }
  ]
}
```

### The six display modes

| Mode | When to use | How it renders |
|---|---|---|
| `side-by-side` | Stanza counts and lengths roughly match. Most lieder, art song, choral works. | Two columns desktop, original LEFT, translation RIGHT, vertically aligned per stanza. Translation italic, 95% opacity. **Stacks on mobile.** |
| `stacked` | Long or asymmetric stanzas. Top-to-bottom reading flow. | Always stacked. Per stanza: original block first, translation immediately below in italic at 90% opacity, subtle indent. Each pair visually grouped. |
| `interlinear` | Word-by-word or line-by-line correspondence matters. Pedagogical, liturgical, biblical. | Each LINE of original immediately followed by its translation line, alternating, translation italic and slightly muted. Tight line-height, no blank line between the pair. |
| `facing-page` | Long-form text where each language should flow independently. | Two columns, but stanzas NOT vertically aligned per-stanza — each column flows on its own. Useful when stanza lengths differ a lot. |
| `original-only` | English program (e.g. the Ruckus voice sample), or no translation needed. | Single column, no translation rendered. |
| `translation-only` | Audience can't read original script (Cyrillic, Arabic, CJK) and needs the translation as primary text. | Single column showing translation. Optional small italic block at end with original for reference. |

### Runtime user toggle (recommended)

Render a small toolbar above each song-text block letting the **reader** switch display mode at runtime. The JSON sets the *default*, but readers benefit from choosing for themselves — someone fluent in German may switch Erlkönig to `original-only`; a learner may want `interlinear`. Persist the choice per-program via `localStorage`.

The toggle should look something like a row of small text buttons: `Side-by-side · Stacked · Interlinear · Original only`. Hide modes that don't apply (e.g. don't show a "Side-by-side" toggle on a song-text block with no `translation` data).

### Other rendering rules

- **Mobile behavior**: `side-by-side` stacks; `facing-page` stacks the columns (each full text shown sequentially); other modes are unchanged.
- **Translator credit**: appears once at the foot of the song-text block, italic small caption — `Translation by Richard Wigmore`.
- **Speaker label**: when present, render as a small italic label above the stanza.
- **isChorus**: indent the stanza and italicize.
- Use the `lang` HTML attribute on the original-text column matching `originalLanguage` for accessibility, screen readers, and hyphenation.

---

## Visual tokens — DARK MODE (this is firm)

Inherit the existing app theme. Use CSS custom properties so the whole skin can be retuned from `tokens.css`:

```css
:root {
  /* Surface */
  --bg-page:        #0A0A0A;     /* near-black page background */
  --bg-elevated:    #161616;     /* cards, callouts (elevated panels) */
  --bg-callout:     #1F2937;     /* the "mission box" — slightly bluer dark slate */
  --bg-header-band: #000000;     /* the Vivo header band stays pure black */

  /* Text */
  --text-primary:   #F5EFE0;     /* cream — the main body text color */
  --text-muted:     #B8B0A0;     /* warm grey for fine print, captions */
  --text-faint:     #7A7368;     /* music credits, copyright lines */
  --text-accent:    #FFFFFF;     /* pure white for emphasis / piece titles */

  /* Borders & rules */
  --rule:           rgba(245, 239, 224, 0.12);
  --rule-strong:    rgba(245, 239, 224, 0.24);

  /* Type */
  --font-sans:  "IBM Plex Sans", system-ui, sans-serif;
  --font-serif: "Source Serif Pro", Georgia, serif;
  --font-display: "Source Serif Pro", Georgia, serif;  /* condensed italic caps for dance piece titles */
}
```

Type rules:
- Body: `--font-sans` at 16px, line-height 1.5
- Prose program notes: `--font-serif` at 17px, line-height 1.65, max-width 680px
- Piece titles in dance programs: `--font-display`, italic, all-caps, letterspacing 0.04em, color `--text-accent`
- Tabular work/composer rows: `--font-sans`, composer bold, movements indented at 1.5rem
- Music credits / copyright: 13px, `--text-faint`, justified
- Translation column: italic, 95% opacity to subtly de-emphasize vs original
- Italics for descriptions and stage directions retain warm cream — don't fade them

Spacing:
- Generous vertical rhythm. 4rem between major sections, 2rem between pieces, 1.5rem between credits and description within a piece.
- Max content width 720px for prose, 880px for tabular sections.

Hairlines instead of solid borders — `1px solid var(--rule)` for separators between pieces or callout edges.

---

## Suggested architecture

```
program-book/
├── schema/
│   └── program.json              # JSON Schema, includes translation fields + displayStyle
├── samples/
│   ├── dance_program.json
│   ├── voice_program.json
│   ├── orchestra_program.json
│   ├── classical_program.json
│   ├── translation_example.json
│   └── screenshots/              # visual reference (print versions on cream paper)
├── src/
│   ├── App.tsx                   # entry: loads JSON, picks renderer
│   ├── shell/
│   │   ├── ProgramShell.tsx      # Vivo header band, footer, survey QR — wraps every program
│   │   ├── Cover.tsx             # cover block (date, venue, title, eyebrow)
│   │   └── SponsorFooter.tsx
│   ├── sections/
│   │   ├── ProgramSection.tsx    # router: dispatches to Centered or Tabular layout based on displayStyle
│   │   ├── ProgramCentered.tsx   # dance layout
│   │   ├── ProgramTabular.tsx    # orchestra/classical/voice work-list layout, supports Part grouping
│   │   ├── NotesSection.tsx      # long-form prose + nested sub-sections
│   │   ├── SongTextBlock.tsx     # translation-aware lyric renderer with mode toggle
│   │   ├── CastSection.tsx       # company members + creative team
│   │   ├── BiosSection.tsx       # artist bios
│   │   ├── RosterSection.tsx     # "Performers and the work" (voice)
│   │   ├── CalloutBlock.tsx      # accented dark panel (mission, archives)
│   │   └── PerformanceSponsor.tsx
│   ├── styles/
│   │   ├── tokens.css            # CSS custom properties (the dark palette above)
│   │   ├── base.css              # body, type, defaults
│   │   └── print.css             # @media print — invert to cream paper for actual printouts
│   └── utils/
│       └── slug.ts
└── README.md
```

The `program` section should accept a `displayStyle: "centered" | "tabular"` field. The router picks the right component. Default if unspecified: dance → centered, all others → tabular. Keep both renderers reading the same `pieces[]` shape so the JSON parser doesn't need to branch.

---

## Print stylesheet

The web app is dark-themed, but `@media print` should swap to **cream paper / black ink** so users can actually print a clean program. This is the one place the original print aesthetic returns:

```css
@media print {
  :root {
    --bg-page: #F5EFE0;
    --bg-elevated: #FFFFFF;
    --text-primary: #1A1A1A;
    --text-muted: #555;
    --text-faint: #777;
    --text-accent: #000;
    --rule: rgba(0,0,0,0.15);
  }
  /* hide chrome */
  .header-band, .survey-qr, nav { display: none; }
  /* page breaks */
  .program-piece { break-inside: avoid; }
  .section { break-before: auto; }
}
```

---

## Acceptance criteria

A reviewer comparing the four sample JSONs rendered should be able to confirm:

1. **Dance (`dance_program.json`)**: Each piece reads as a centered block — title, year, credits, description, note, music credits — matching `dance_piece.png`. Intermissions and pauses are unmistakable. The Revelations sub-sections (Pilgrim of Sorrow / Take Me to the Water / Move, Members, Move) display the suite structure clearly per `dance_subsections.png`. Both Program A and Program B render correctly from the same data.
2. **Orchestra (`orchestra_program.json`)**: The two-column composer/work layout is preserved per `orchestra_works.png`. Movements indent under their parent work. Long program notes flow as readable prose with composer headers per `orchestra_notes.png`. The nested "Berlioz's program note for the Symphonie fantastique" displays as a clearly subordinate block inside the Berlioz essay.
3. **Classical (`classical_program.json`)**: Same tabular layout as orchestra per `classical_works.png`, with italicized tempo names (Scherzo, Blues, Perpetuum mobile). Prose notes per `classical_notes.png`. Plus a clean trailing artist-bios section.
4. **Voice (`voice_program.json`)**: Parts I–IV group the works visually with Part headings per `voice_works.png`. The performer roster reads cleanly with ensemble grouping. The dark callout block stands out (a hair lighter than page bg, or with a subtle border). Song texts render in stanzas per `voice_song_texts.png`. **The renderer must produce all six translation display modes (side-by-side, stacked, interlinear, facing-page, original-only, translation-only) when given the corresponding fragments from `translation_example.json`, and a runtime toggle lets the reader switch between modes.**
5. **All four** share the same shell — Vivo header band, sponsor footer, survey QR — without duplication in the JSON.
6. **Theme**: Black page, cream text, throughout. No accidental light-mode panels. The only place light/cream-paper appears is `@media print`.
7. **Print**: `Cmd-P` produces a clean PDF resembling the original printed program.

---

## Iteration order I'd suggest

Don't try to build all four renderers at once. Sequence:

1. **Shell + tokens** — get the dark theme, header band, sponsor footer, and cover working with `dance_program.json`. Show me before continuing.
2. **Dance renderer** (`ProgramCentered`) — test against `dance_program.json`. Show me one piece (The Holy Blues) and the Revelations sub-sections. Compare against `dance_piece.png` and `dance_subsections.png`.
3. **Tabular renderer** (`ProgramTabular`) — test against `classical_program.json` first (simplest), then `orchestra_program.json` (adds long notes). Compare against `classical_works.png` and `orchestra_works.png`.
4. **Notes renderer** with nested sub-sections — get the Berlioz nested-program-note case working. Compare against `orchestra_notes.png`, `classical_notes.png`.
5. **Voice extras** — Part grouping, roster, callout, then `SongTextBlock`. Compare against `voice_works.png`, `voice_song_texts.png`.
6. **Translation rendering** — work through `translation_example.json` and verify ALL six display modes render correctly: side-by-side (Erlkönig), stacked (Lascia ch'io pianga), interlinear (Bach BWV 82), facing-page (Mahler Rückert-Lied), original-only (Beautiful Dreamer), translation-only. Then add the runtime user toggle.
7. **Print stylesheet** last.

---

## What NOT to do

- Don't invent a CMS or admin UI — JSON in, HTML out.
- Don't pull in heavyweight frameworks (Next.js, etc.) — Vite + React is plenty.
- Don't try to OCR or parse PDFs at runtime — parsing happens upstream.
- Don't switch to light mode at any point in the live app. Print stylesheet is the only exception.
- Don't lock styling so tightly that an editor can't tweak `tokens.css` and re-skin the whole thing.
- Don't try to handle the JSON schema variations by branching at the section level — solve it in one place (the renderer router) using `displayStyle`.
- Don't replicate the print aesthetic onto the dark theme literally (e.g. don't paint a cream rectangle behind a piece). Transpose the structure, not the surface.
