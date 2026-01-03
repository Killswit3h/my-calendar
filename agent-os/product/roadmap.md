# Roadmap

## Now (P0)
- Convert the project detail workspace to include the pay-application layout (green mock) without altering existing shell layout.
- Map existing operational checklist items to the Procedure Check List with status boxes; reuse current status/notes data sources where possible.
- Add Notes / Other Information panel linked to existing project notes.
- Display Contract Quantities table populated from current contract/pay item data; show installed quantity pulled from calendar-installed quantities/stations.

## Next (P1)
- Add Stockpile table that mirrors pay items and auto-calculates unit rate deductions based on entered stockpile amounts per pay item.
- Add Change Orders table for additional pay items/quantities/rates; only visible/used when change orders exist.
- Implement phase sections (Phase 1, Phase 2, etc.) that list pay items, descriptions, quantity, installed quantity (from calendar), and phase metadata (locate ticket, dates, ready-to-work, onsite review yes/no, surveyed yes/no, status/date).
- Provide search/filter by phase number (lightweight client-side filter).
- Button to generate pay application `.csv` aligned to current pay items, stockpile deductions, and change orders.

## Later (P2)
- PDF export that mirrors the pay-application layout using existing `pdf-lib` module style.
- Audit history/versioning for pay application drafts and checklist status changes.
- Role-aware controls for editing vs. viewing the pay application workspace.

## Risks & dependencies
- Must preserve existing timezone handling and FullCalendar all-day exclusive end behavior to avoid quantity drift.
- No schema changes planned; implementation must reuse current Prisma models and APIs.
- Layout must honor current dashboard shelf and content pane constraints; avoid refactoring flex/grid containers unless required by the new sections.

