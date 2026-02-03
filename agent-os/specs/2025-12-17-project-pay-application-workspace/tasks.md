# Tasks: Project Pay Application Workspace

## Phase 1 — UX & Data Mapping
- [x] Inventory existing project-detail components to slot the new workspace without changing the shell layout.
- [x] Map data sources: pay items, event/station-installed quantities, checklist/notes, change orders, stockpile inputs; confirm no schema/API changes needed.
- [x] Define UI sections and responsive behavior (stacked mobile, grid desktop) aligned to Material 3 styling.
- [x] Outline CSV export shape based on existing billing report patterns and pay item data.

## Phase 2 — Checklist + Notes
- [x] Reuse/adapt `ProjectChecklistCard` for Procedure Check List items (contract signed, COI, bond, material compliance, EEO, payroll).
- [x] Add Notes/Other Information panel adjacent to checklist header; bind to existing notes storage if available.
- [x] Preserve status cycling and notes interactions; ensure dark/glassy styling fits the workspace.

## Phase 3 — Contract Quantities Table
- [x] Build table for pay item, description, contract qty, installed qty, completion %, rate (if available).
- [x] Wire installed qty aggregation from calendar/station quantities; respect FullCalendar all-day exclusive end and timezone handling.
- [x] Ensure desktop headers + mobile stacked layout; no schema changes.

## Phase 4 — Stockpile Deductions
- [x] Create stockpile table mirroring pay items; allow entering stockpile quantities.
- [x] Compute unit-rate deduction using existing pay item rate data; reflect in displayed totals (no schema writes).
- [x] Keep separation from base contract quantities for clarity.

## Phase 5 — Change Orders
- [x] Add change orders table for additional pay items/quantities/rates; hide/empty state when none.
- [x] Keep contract vs change-order totals distinct in UI and export.

## Phase 6 — Phases Section + Search
- [x] Implement Phase 1/2/... sections listing pay items with description, quantity, installed qty (from calendar), locate ticket #, created date, ready-to-work date, onsite review yes/no, surveyed yes/no, notes, status/date.
- [x] Add lightweight search/filter by phase number/name.
- [x] Ensure mobile-friendly stacked cards and readable desktop layout.

## Phase 7 — CSV Pay Application Export
- [x] Add action/button to generate pay application CSV including contract quantities, stockpile deductions, and change orders.
- [x] Reuse export/report patterns from `src/app/reports/billing/page.tsx`; align units/precision and timezone-aware dates.

## Phase 8 — Integration, Roles, QA
- [x] Respect existing role-aware view/edit behaviors on the project page (if present).
- [x] Validate that installed quantity aggregation matches calendar data; verify all-day exclusive end handling.
- [x] Check accessibility (focus states, labels) and responsiveness under current layout constraints.
- [x] Smoke-test CSV export for totals alignment and correct formatting.

