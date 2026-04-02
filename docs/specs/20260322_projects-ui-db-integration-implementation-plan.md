# Implementation Plan: Projects UI + DB/API Integration

## Overview

This plan replaces mock-driven projects pages with live data from the existing backend stack while preserving current UX intent and keeping event-level edits on Calendar. The approach is adapter-first: wire existing entities (`customers`, `projects`, `project_pay_item`, `pay_item`, `event_quantity`) before schema additions, then add only missing persisted fields required by UX. Primary risks are status contract drift, route naming drift, and unclear phase persistence.

## Pre-Planning Summary

- **README / project context**: Projects and calendar are tightly integrated; quantity workflows already exist and are intended to feed reporting.
- **Relevant specs**:
  - `docs/specs/20260322_projects-ui-db-integration-contract.md` (source contract for this plan)
  - `docs/specs/projectEndpoint.md`
  - `docs/specs/20260206_project-pay-items-api.md`
  - `docs/specs/20260206_event-quantities-api-and-controller-helpers.md`
- **Rules / conventions**: Keep route handlers thin, business rules in services, repository-first Prisma access, typed domain errors, and existing endpoint contracts unless explicitly changed.
- **Existing code to leverage**:
  - API CRUD endpoints for projects/pay-items/project-pay-items/event-quantities
  - Existing project workspace components
  - Existing service validation/normalization patterns for FK and decimal fields

## Critical Requirements & Quality Gates

- **Independent testability**:
  - R1 status contract: service/controller tests for valid/invalid statuses.
  - R2 metadata persistence: migration + API + tests for create/update/read.
  - R3 phase mapping: tests for project pay item field persistence and retrieval.
  - R6/R7 UI behavior: targeted manual verification on projects and calendar pages.
- **Coverage before advancing**:
  - A step is complete only when its completion checklist passes (tests/lint/manual checks).
  - No downstream UI wiring step proceeds while API contract or migration tests are failing.
- **Breaking changes**:
  - Potential behavioral change: canonical status values become `Not Started/In Progress/Completed`.
  - API path churn is out of scope; use already-created canonical endpoints.
- **Spec documents**:
  - Contract: `docs/specs/20260322_projects-ui-db-integration-contract.md`
  - This plan file: `docs/specs/20260322_projects-ui-db-integration-implementation-plan.md`
  - Update existing entity specs only if contract changes are introduced.

## Key Changes

| Change | Description |
|--------|-------------|
| Projects data source replacement | Remove mock dependency from projects routes and hydrate from APIs |
| UI adapter layer | Translate backend payloads to existing UI shape consistently |
| Project metadata persistence | Add missing DB/API fields required by UX (confirmed set) |
| Quantity rollups | Populate installed quantities from `event_quantity` aggregates |
| Route contract alignment | Ensure touched frontend code calls existing canonical endpoints |

## Breaking Changes Identified

- Project status value contract may change from mixed historical values to strict `Not Started/In Progress/Completed`.
- If new `project` columns are added as non-null, migration ordering and defaults must avoid write-path regressions.

## Implementation Steps

### Step 1: Lock contracts and field map — Status: Pending

**Step Content (if Pending/Not Started):**
- Finalize canonical UI-to-API field map for projects list/detail and workspace.
- Confirm required `project` metadata fields to persist from UX (`code`, `owner`, `district`, `project_type` and enum/value sets).
- Confirm phase persistence decision: map to existing `project_pay_item` fields now and mark unsupported fields explicitly.

**Step Completion Requirements:**
- [ ] Field map documented in the contract spec or companion note.
- [ ] Open questions reduced to explicit go/no-go decisions.
- [ ] No unresolved ambiguity for status values.

### Step 2: Stabilize backend status + metadata schema contract — Status: Pending

**Step Content (if Pending/Not Started):**
- Align `ProjectService` validation/default behavior to canonical statuses.
- Add migration and Prisma schema changes for required project metadata fields that are in UX but missing in DB.
- Update controller/service DTO handling for new fields and validation rules.

**Step Completion Requirements:**
- [ ] Migration created and schema compiles.
- [ ] `ProjectService` tests updated for new status/metadata rules.
- [ ] `ProjectController` tests confirm create/update/get surfaces include required fields.

### Step 3: Build projects UI data adapter and API clients — Status: Pending

**Step Content (if Pending/Not Started):**
- Add a typed adapter module that maps backend entities to existing projects UI view models.
- Add fetch helpers for:
  - projects (+ customer relation)
  - project pay items (+ pay item relation)
  - event quantity rollups by project pay item
- Keep calls on canonical existing endpoints.

**Step Completion Requirements:**
- [ ] Adapter unit tests or focused type-level checks pass.
- [ ] No direct mock data imports used in wired pages.
- [ ] All API calls in touched projects UI use canonical routes.

### Step 4: Replace mock usage in projects pages — Status: Pending

**Step Content (if Pending/Not Started):**
- Wire `src/app/projects/page.tsx` and company/detail/new pages to real API-backed data.
- Use adapter output to keep presentational components stable.
- Preserve current UX layout and behavior while replacing data source.

**Step Completion Requirements:**
- [ ] `/projects` renders live data from DB.
- [ ] `/projects/[companyId]` and `/projects/[companyId]/[projectId]` render live data.
- [ ] Manual smoke test confirms navigation and rendering work without mock data.

### Step 5: Wire contract + installed quantities and phase fields — Status: Pending

**Step Content (if Pending/Not Started):**
- Populate contract quantities from `project_pay_item` + `pay_item`.
- Populate installed quantities via aggregated `event_quantity`.
- Map persisted phase-like fields to `project_pay_item`:
  - `begin_station`, `end_station`, `status`, `locate_ticket`, `LF_RT`, `onsite_review`, `notes`
- Keep unsupported phase fields explicitly non-persisted unless approved for schema addition.

**Step Completion Requirements:**
- [ ] Contract and installed quantities display correctly for at least one project with data.
- [ ] Updating calendar quantities is reflected in projects view after refresh.
- [ ] No event CRUD added to projects page.

### Step 6: Regression pass and hardening — Status: Pending

**Step Content (if Pending/Not Started):**
- Run focused backend tests for touched entities and status logic.
- Run lint/type checks for touched frontend and server files.
- Validate core end-to-end flow:
  - customer -> project -> project pay item -> event quantity (calendar) -> projects rollup.

**Step Completion Requirements:**
- [ ] Targeted tests for projects/project-pay-items/event-quantities pass.
- [ ] Lint/type checks pass on changed files.
- [ ] Manual verification checklist completed for projects and calendar boundaries.

## Best Practice Adherence

- **Rules referenced**:
  - `backend-api.mdc`
  - `backend-queries.mdc`
  - `validation.mdc`
  - `error-handling.mdc`
  - `spec-driven-quality.mdc`
  - `conventions.mdc`
- **Subagents to consider**:
  - `test-gap-analyst` for post-implementation coverage audit.
  - `failure-repro-minimizer` if regressions appear during integration.
- **Conventions**:
  - Keep route handlers thin.
  - Service layer owns validation and normalization.
  - Preserve timezone-sensitive event handling.
  - Avoid endpoint shape changes unless explicitly approved.

## Testing Strategy

- **Unit tests**:
  - Service/controller tests for `ProjectService` and `ProjectController` status + metadata rules.
  - Service/controller tests for `ProjectPayItem` and `EventQuantity` if phase/quantity mappings change.
- **Integration / E2E**:
  - Manual integration flow from calendar quantity entry to project workspace rollup.
- **Manual verification**:
  - Projects board renders real DB records.
  - Detail workspace shows contract/install values from backend entities.
  - Calendar still owns event and quantity editing.
- **Test execution**:
  - `npm test -- tests/server/services/ProjectService.test.ts`
  - `npm test -- tests/server/controllers/ProjectController.test.ts`
  - `npm test -- tests/server/controllers/ProjectPayItemController.test.ts`
  - `npm test -- tests/server/controllers/EventQuantityController.test.ts`
- **Coverage gate**:
  - Do not mark implementation complete until targeted tests and manual smoke checks pass.

## Potential Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Status mismatch across old/new flows | Enforce one canonical status set in service validation and tests |
| Route drift (`payitems` vs `pay-items`) in existing UI surfaces | Normalize touched callers to canonical existing endpoints and verify with smoke tests |
| Missing DB columns for UX metadata | Add focused migration with defaults/nullability and explicit API validation |
| Phase data ambiguity | Persist only explicitly mapped fields on `project_pay_item`; defer others with explicit notes |
| Quantity performance issues | Prefer aggregated queries by project, avoid N+1 per line-item fetches |

## Clarifications Provided

- **Q: Which status set should be used?**
  - A: `Not Started`, `In Progress`, `Completed`.
- **Q: Should UX metadata fields be persisted?**
  - A: Yes, if they exist in UX they should be real DB fields.
- **Q: Are phases a new table?**
  - A: Not yet decided; investigate existing naming/modeling first.
- **Q: Stockpile persistence approach?**
  - A: Keep `stockpile_billed` as persisted value.
- **Q: API naming direction?**
  - A: Keep APIs to existing created endpoints.

