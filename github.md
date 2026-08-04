repo: kristinotharsson-cpu/vivo-program-books
branch: main

## Last sync
date: 2026-08-04T12:40:00Z
note: Upload bundle rebuilt in _github_upload/ (read-only GitHub access — the user pushes via the download bundle or git).

### Updated in this project
- Program page rebuilt: labeled data inputs for name/date/time/venue, one raw-text window for the whole running order, no hyphen before the instrument
- Credits block reordered — management credit, performance sponsor, additional sponsor, season sponsors, Mass Cultural Council line (season + agency line standard on every program)
- Standard TOC cards: survey / feedback card (up to two links) and a group-sales + student-tickets carousel; Vivo Supporters guaranteed on every book
- About the Artist opens collapsed with 44px chevron buttons; From the Archives collapses; supporter names edited as one comma-separated box; global a.m./p.m. → AM/PM

## Screen map
| Screen / area | Built from |
| --- | --- |
| App shell, cover, TOC, standard TOC cards, routing, edit-mode bar | app.jsx |
| Section renderers (program, notes, bios, sponsors, supporters, events, ads) | sections.jsx |
| UI primitives (Editable, PlainField, Icon, ReaderNav, IndexLink, PhotoSlot) | components.jsx |
| Rich-text formatting bar + sanitizer | editor-suite.js |
| Persistence + shared-content versioning | storage.js |
| Sample program content | data.js |
| Program book host page + boot loader | Program Book.html |
| Season index | index.html / index.jsx / index.css |
| Import flow | import.html / import-app.jsx / import-overlay.jsx / import.css |
| Styles / tokens | app.css / vivo.css / vivo-section.css |
| Program content (80 shows + shared + manifest) | shows/ |
| Backend | netlify/functions/programs.mjs, netlify.toml, package.json |

## Sync history
- 2026-07-24 — rich-text suite, section rail, program module styles, shared-content date versioning
