# Projects UI + DB/API Integration — Contract spec (pre-implementation)

| Field | Value |
|-------|-------|
| Ticket | N/A — Wire Projects UI to existing DB/API stack |
| Date | 2026-03-22 |
| Spec root | `docs/specs/` |

## Acceptance criteria (source)

User-provided constraints and decisions:

1. Project status model is `Not Started` / `In Progress` / `Completed`.
2. UX fields like project code/owner/district/project type should be real DB fields if present in UX.
3. Confirm where "phase" data should persist; investigate whether an existing table already captures it.
4. `stockpile_billed` is acceptable as the stockpile persisted value.
5. Keep APIs aligned to already-created endpoints (do not introduce alternate API families).
6. Projects page scope includes `customers`, `projects`, `project_pay_item`, `pay_item`, `event_quantity`.
7. Event-level operations remain on Calendar page.

## Traceability

| # | AC excerpt | Requirement id | Notes |
|---|------------|----------------|-------|
| 1 | Use Not Started/In Progress/Completed | R1 | Normalize project status contract in UI + API/service validation/defaults |
| 2 | UX fields should be real DB fields | R2 | Add migration + API exposure for missing project metadata fields |
| 3 | Determine where phase data belongs | R3 | No `phase` model found; map to `project_pay_item` unless new table is explicitly approved |
| 4 | stockpile billed is fine | R4 | Keep `project_pay_item.stockpile_billed` as persisted stockpile value |
| 5 | Keep created APIs | R5 | Use canonical existing endpoints (`/api/projects`, `/api/project-pay-items`, `/api/pay-items`, `/api/event-quantities`, `/api/customers`) |
| 6 | Projects page includes specific entities | R6 | Projects UI must query and compose these 5 entities |
| 7 | Event info belongs on calendar | R7 | Projects page consumes event-quantity rollups; event CRUD remains on Calendar workflows |

## Scope

- In scope:
  - Replace mock data usage in projects pages with API-backed data.
  - Introduce a UI adapter layer that maps backend models to existing UI component shapes.
  - Add any missing `project` columns required by UX contract (after final field list confirmation).
  - Wire contract quantities from `project_pay_item + pay_item` and installed quantities from aggregated `event_quantity`.
  - Keep Calendar as the event-level source of truth.
  - Align route usage to existing created APIs and remove route drift in touched surfaces.
- Out of scope:
  - Rebuilding calendar event workflows.
  - Re-architecting controller/service/repository stack.
  - New external integrations.
  - Large visual redesign of the projects UI.

## Behavior

- Projects list page:
  - Reads from `GET /api/projects?expanded=true`.
  - Resolves customer display values from `customer` relation (or customer lookup endpoint where needed).
  - Maps backend statuses to board lanes using canonical status set.
- Project detail page:
  - Loads project metadata from `GET /api/projects/[id]?expanded=true`.
  - Loads project contract rows from `GET /api/project-pay-items?project_id=<id>&expanded=true`.
  - Uses `pay_item` relation for number/description/unit display.
  - Computes installed quantity per project pay item from `event_quantity` aggregates.
- New project flow:
  - Company/customer picker reads from real customers.
  - Create persists via `POST /api/projects` using validated schema fields.
- Phases:
  - Phase-like fields persist on each `project_pay_item`:
    - `begin_station`, `end_station`, `status`, `locate_ticket`, `LF_RT`, `onsite_review`, `notes`, `ready_to_work_date`, `status_date`, `surveyed`.
  - UI uses a flat list of project pay item rows (no separate `phase` table).
- Stockpile:
  - Persist stockpile value via `project_pay_item.stockpile_billed`.
  - Derived UI calculations can remain client-derived from qty/rate inputs.

## Errors and edge cases

- Validation failures return typed 400 errors via domain errors.
- Missing records return 404.
- Conflicts (e.g., unique project name/pay item number) return 409.
- If a required relation is missing (`customer_id`, `project_id`, `pay_item_id`, etc.), return 400 with user-fixable message.
- Invalid status values outside `Not Started`, `In Progress`, `Completed` are rejected.
- Projects page must gracefully handle:
  - Projects with no project pay items.
  - Project pay items with zero event quantities.
  - Missing optional metadata fields.

## Pay application workspace save (2026-04-01 addendum)

- **Save Project** persists in one user action (client orchestration: `PATCH /api/projects/:id` then `POST`/`PATCH`/`DELETE /api/project-pay-items/*` as needed; partial failure is possible until a composite transactional endpoint exists).
- **Project-level fields** (optional on PATCH):
  - `procedure_checklist`: JSON object whose keys are the procedure checklist keys in UI (`contract`, `coi`, `bond`, `material`, `eeo`, `payroll`). Values: `NOT_STARTED` | `IN_PROGRESS` | `COMPLETE`.
  - `pay_application_notes`: free-text notes for the pay application workspace.
- **Project pay item** rows: the Contract and Phases tabs share one list keyed by `project_pay_item.id`. Editable persisted fields include `contracted_quantity`, `stockpile_billed`, `unit_rate`, `notes`, `begin_station`, `end_station`, `status`, `locate_ticket`, `LF_RT`, `onsite_review`, `ready_to_work_date`, `status_date`, `surveyed`.
- **Forbidden on workspace save:** writing **installed** quantity from this page; installed totals remain aggregates of `event_quantity` / calendar workflows (**R7**).
- **Phases tab:** flat **one row per `project_pay_item`**; no nested synthetic phase entities persisted.
- **Create line:** `POST /api/project-pay-items` accepts `pay_item_number` (exact catalog match, case-insensitive) **or** `pay_item_id`. Unknown pay item numbers are rejected (400).
- **Delete line:** `DELETE` is blocked with a business error if any `event_quantity` rows reference that `project_pay_item` (protect calendar data).
- **Stockpile UI “purchased qty”:** not persisted in v1 (display/input only). **`stockpile_billed`** stores the dollar amount from the stockpile section.
- **Out of scope v1:** change orders (no DB/API in this slice), pay application CSV export backend.

## Open questions

- Which exact UX metadata fields are mandatory for day-1 persistence on `project`:
  - `code`, `owner`, `district`, `project_type` (confirm exact naming and allowed values)?
- Confirm whether `onsite_review` should remain string (current schema) or migrate to boolean.

## Likely implementation touchpoints

- Projects UI pages:
  - `src/app/projects/page.tsx`
  - `src/app/projects/[companyId]/page.tsx`
  - `src/app/projects/[companyId]/[projectId]/page.tsx`
  - `src/app/projects/new/page.tsx`
  - `src/app/projects/[companyId]/[projectId]/ProjectWorkspaceClient.tsx`
- Projects workspace components:
  - `src/components/project/ProjectHeader.tsx`
  - `src/components/project/PayApplicationWorkspace.tsx`
  - `src/components/project/PayApplicationContractView.tsx`
  - `src/components/project/PayApplicationPhasesView.tsx`
- API and server layers:
  - `src/app/api/projects/*.ts`
  - `src/app/api/project-pay-items/*.ts`
  - `src/app/api/pay-items/*.ts`
  - `src/app/api/event-quantities/*.ts`
  - `src/server/controllers/ProjectController.ts`
  - `src/server/services/ProjectService.ts`
  - `src/server/services/ProjectPayItemService.ts`
  - `src/server/services/EventQuantityService.ts`
- Schema and migration:
  - `prisma/schema.prisma`
  - `prisma/migrations/<new_migration>/migration.sql`
- Tests:
  - `tests/server/controllers/ProjectController.test.ts`
  - `tests/server/services/ProjectService.test.ts`
  - `tests/server/controllers/ProjectPayItemController.test.ts`
  - `tests/server/services/ProjectPayItemService.test.ts`

