# Specification: Project Pay Application Workspace

## Goal
Integrate a pay-application workspace into the existing project detail page that mirrors the green mock: unify checklist status, notes, contract quantities, stockpile deductions, change orders, phase tracking, and pay application export while pulling installed quantities from calendar/station data.

## User Stories
- As a project manager, I want to view contract quantities, stockpile deductions, and change orders together so I can prepare pay applications without leaving the project view.
- As a field/ops lead, I want installed quantities to flow from calendar/station entries into the pay-application tables so we avoid double entry and quantity drift.
- As finance/admin, I want to export a CSV pay application that aligns with contract quantities and adjustments so billing is fast and audit-ready.

## Specific Requirements

**Workspace layout within existing shell**
- Embed the pay-application workspace inside the current project layout (dashboard shelf + content panes) without refactoring global flex/grid containers.
- Keep Material 3/dark, glassy styling consistent with current cards; avoid absolute positioning except where already used.
- Maintain responsive behavior similar to existing project cards (stack on small screens, grid on larger).

**Procedure checklist and notes**
- Render checklist items (contract signed, COI, bond, material compliance forms, EEO compliance, payroll) with status boxes; allow toggling status and showing stored notes per item.
- Display a Notes / Other Information panel adjacent to the checklist header area for freeform project notes; reuse existing notes storage if available.
- Preserve current checklist behaviors from `ProjectChecklistCard` (status cycling, note viewing) and adapt styling to the new layout.

**Contract quantities table**
- Show pay item number, description, contract quantity, installed quantity (aggregate from calendar/station quantities), completion %, and rate where applicable.
- Installed quantity must rely on existing event/station quantity data; all-day events use `YYYY-MM-DD` with exclusive end in month view and existing timezone handling.
- Support read-friendly tabular layout with desktop headers and stacked mobile rows; no schema changes.

**Stockpile deductions**
- Provide a stockpile table mirroring pay items to capture stockpiled quantities and compute unit-rate deductions for billing.
- Use pay item definitions already in the system; allow user-entered stockpile amounts while keeping rates sourced from existing pay item data.
- Reflect deductions in the pay application summary/export without altering underlying pay item records.

**Change orders**
- Include a change orders table for additional pay items/quantities/rates when change orders exist; hide/empty state when none.
- Keep separation between base contract quantities and change orders for clarity in export and UI.

**Phase tracking with search**
- For each phase (Phase 1, Phase 2, …), list pay item rows with description, quantity, installed qty (from calendar), and per-phase metadata (locate ticket #, created date, ready-to-work date, onsite review yes/no, surveyed yes/no, notes, status/date).
- Provide a lightweight search/filter by phase number/name.
- Keep layout readable on mobile (stacked cards) and table-like on larger screens.

**CSV pay application export**
- Add a “Create/Generate Pay Application CSV” action that exports contract quantities, stockpile deductions, and change orders in one file.
- Reuse existing export/report patterns (see billing report) and avoid new schema; ensure amounts align with displayed totals.
- Respect timezone/date handling from calendar data when deriving installed quantities.

**Data integrity and constraints**
- Do not change Prisma schema or existing API endpoints; reuse current data sources (pay items, event quantities, checklist/notes).
- Preserve FullCalendar all-day exclusive end handling and existing timezone logic in all aggregations.
- Maintain role-aware UI behavior consistent with current project page (view vs edit) if present.

## Visual Design
No visual assets are stored in `planning/visuals/`. Use the provided green mock from the request as guidance:
- Checklist with status boxes and adjacent notes panel at the top.
- Contract quantities, stockpile, and change orders as separate tables with pay item/description/qty/completion/rate columns.
- Phases section with pay item rows plus locate ticket, dates, onsite review and surveyed toggles, notes, status/date; includes search by phase number.
- Action button on the top/right area to generate pay application CSV.

## Existing Code to Leverage

**`src/components/project/ProjectChecklistCard.tsx`**
- Provides checklist item definitions, status cycling, and notes interactions suitable for the Procedure Check List section.

**`src/components/project/ProjectQuantitiesCard.tsx`**
- Offers quantities table styling/responsiveness and installed vs contract display patterns that match the Contract Quantities table needs.

**`src/components/EventQuantitiesEditor.tsx`**
- Supplies pay item search/selection and quantity entry logic that can power installed quantity aggregation and reuse pay item definitions.

**`src/app/reports/billing/page.tsx`**
- Demonstrates reporting/export formatting for pay items/quantities; useful for CSV generation shape and formatting.

**`src/components/CalendarWithData.tsx`**
- Source of calendar event data and timezone/all-day handling that must be preserved when aggregating installed quantities.

## Out of Scope
- Prisma schema changes or new database tables/models.
- Full PDF redesign (keep existing pdf-lib module for future use).
- Global layout/shelf refactors or unrelated navigation changes.
- New authentication/authorization systems beyond current role behaviors.
- Non-related inventory or dashboard features not part of the pay-application workspace.

