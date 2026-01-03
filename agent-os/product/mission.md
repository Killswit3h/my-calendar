# Mission

## Product vision
Build a unified FDOT-style calendar and project operations workspace where field teams, project managers, and administrators can plan work, record installed quantities, track compliance checklists, and generate pay applications without leaving the project view.

## Users
- Project managers coordinating FDOT jobs and approvals.
- Field supervisors/inspectors capturing quantities and compliance statuses from the calendar/stations.
- Operations/finance staff preparing pay applications, exports, and audits.

## Problems we solve
- Fragmented tracking of contract quantities, stockpile deductions, change orders, and compliance checklists.
- Slow handoff between field data (calendar-installed quantities) and pay application generation.
- Missing FDOT-specific behaviors (multi-day/all-day handling, exclusive end dates in month view) that can skew totals and reporting.

## Approach
- Keep the existing project page layout and integrate a pay-application workspace (green mock) that mirrors FDOT checklist, contract quantities, stockpile deductions, change orders, and phase-level tracking.
- Surface calendar-installed quantities directly in the pay items/phase tables to avoid double entry.
- Preserve current timezone handling and FullCalendar rules (all-day end is exclusive in month view) to keep totals accurate.

## Success metrics
- Time to assemble a pay application draft reduced (fewer manual merges from calendar to quantities).
- Fewer discrepancies between installed quantities in calendar and pay application totals.
- Checklists and phase status kept up-to-date from one screen without layout regressions.

## Constraints & assumptions
- Next.js 15, TypeScript, Tailwind (Material 3 style), Prisma 6, Neon Postgres; no schema changes unless explicitly requested.
- Maintain existing layout shell (dashboard shelf + content panes) and avoid flex/grid refactors unless required for the new workspace.
- All-day events use `YYYY-MM-DD` with exclusive end in month view; preserve all timezone logic.

