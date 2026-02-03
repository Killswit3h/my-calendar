# Spec Requirements: Project Pay Application Workspace

## Initial Description
Convert the existing project detail subsection into a pay-application workspace (green mock) that brings together the operational checklist status, notes, contract quantities, stockpile deductions, change orders, per-phase tracking, and pay application export while pulling installed quantities from the calendar/stations.

## Requirements Discussion

### First Round Questions

**Q1:** No clarifying questions were asked; proceeding based on the provided mock and current project UI.
**Answer:** User supplied a mock showing checklist status boxes, notes, contract quantities, stockpile, change orders, phases, search, and a pay application CSV button.

**Q2:** Installed quantities should come from calendar/station entries rather than manual duplication.
**Answer:** Confirmed via mock note: installed qty would get pulled from the calendar where quantities are entered.

### Existing Code to Reference
**Similar Features Identified:**
- Feature: Operational checklist card - Path: `src/components/project/ProjectChecklistCard.tsx`
- Feature: Quantities summary card - Path: `src/components/project/ProjectQuantitiesCard.tsx`
- Feature: Event quantities editor (pay item selection/quantities) - Path: `src/components/EventQuantitiesEditor.tsx`
- Feature: Billing report with pay item/quantity export patterns - Path: `src/app/reports/billing/page.tsx`

### Follow-up Questions
No follow-up questions were asked.

## Visual Assets

### Files Provided:
No visual assets provided in `planning/visuals/`. Proceeding from the green mock shared in the request (not stored in repo).

### Visual Insights:
- Layout combines checklist, notes, contract quantities, stockpile, change orders, and phases in a single surface.
- Status boxes for checklist items; notes panel on the right of checklist header area.
- Contract quantities, stockpile, and change orders shown as separate tables with pay item, description, quantity, completion %, and rate.
- Phases list pay items with installed quantities, locate ticket details, dates, onsite review and surveyed yes/no toggles, status/date fields, and a search by phase number.
- Top-right action to create/generate pay application CSV.

## Requirements Summary

### Functional Requirements
- Present a pay-application workspace within the existing project detail layout shell (no shell refactors).
- Procedure checklist section with status indicators for contract signed, COI, bond, material compliance forms, EEO compliance, payroll; keep notes/other info panel adjacent.
- Contract quantities table showing pay item, description, contract qty, installed qty (summed from calendar/stations), completion %, and rate where applicable.
- Stockpile table mirroring pay items with quantities and unit rate deduction calculation based on entered stockpile amounts.
- Change orders table for additional pay items/quantities/rates when change orders exist.
- Phases section (Phase 1, Phase 2, …) listing pay items, description, quantity, installed qty (from calendar), plus locate ticket number, dates (created, ready-to-work), onsite review yes/no, surveyed yes/no, notes, status/date; include search/filter by phase number.
- Action to generate pay application CSV aligned to contract quantities, stockpile deductions, and change orders.
- Preserve timezone handling and FullCalendar all-day exclusive end behavior; all-day dates stay `YYYY-MM-DD`.

### Reusability Opportunities
- Reuse/extend checklist interaction patterns from `ProjectChecklistCard`.
- Reuse quantities display/responsive patterns from `ProjectQuantitiesCard`.
- Reuse pay item selection and quantity entry logic from `EventQuantitiesEditor` to avoid duplicate pay item forms.
- Reuse reporting/export formatting patterns from `src/app/reports/billing/page.tsx`.
- Pull installed quantities from existing calendar/station quantity sources rather than new inputs.

### Scope Boundaries
**In Scope:**
- UI and interaction layer for pay-application workspace within project detail.
- CSV export button/action using existing data sources.
- Aggregations of installed quantities from calendar/stations to display in tables.

**Out of Scope:**
- Database schema changes or new Prisma models.
- Full PDF redesign (use existing pdf-lib module later if needed).
- Global layout/shelf refactors or unrelated page changes.
- New authentication/role systems beyond existing controls.

### Technical Considerations
- Maintain Next.js 15/TypeScript/Tailwind patterns and Material 3-inspired styling; avoid absolute positioning.
- Keep dashboard shelf and content pane constraints; avoid flex/grid refactors.
- All-day events end date is exclusive in FullCalendar month view; installed quantity aggregation must respect existing timezone logic.
- Use existing pay item definitions and quantity sources; avoid duplicating data entry.

