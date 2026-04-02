# Changelog

## Unreleased

- Projects: **Save Project** now sends the name from the inline name field when **Edit Project** is active (previously only `info.projectName` was submitted, so the API often received the default `"New Project"` and hit a false “project with this name already exists” conflict).
- Project pay lines: **`pay_item_id` is optional**; new columns `line_item_number`, `line_item_description`, `line_item_unit` store user-entered contract text when the pay item number does **not** match the `pay_item` catalog (lookup is still used when a catalog row exists). API accepts `pay_item_description` and `pay_item_unit` on POST/PATCH; project workspace sends them on save. Migration: `20260401180000_project_pay_item_free_text_lines`. Free-text creates omit `pay_item` / `pay_item_id` in Prisma (scalar `pay_item_id` is invalid on `create` input).
- Projects workspace: **new project** save now creates `project_pay_item` rows (same payload as edit mode) after POST `/api/projects` returns the real id; previously the client redirected without posting lines, so reopening the project showed no pay items. Existing-project workspace loads pay lines via Prisma in `loadProjectPayRollups` (no RSC self-fetch to `/api/project-pay-items`).
- App root `Providers`: wrap the tree with TanStack `QueryClientProvider` so hooks like `useUserAccess` / `usePlannerApi` work (fixes `/calendar` 500: “No QueryClient set”).
- Projects: PATCH name uniqueness now ignores the current project id (`findFirstByNameCaseInsensitiveExcludingId`), fixing false “project with this name already exists” errors when saving (e.g. ambiguous `findFirst` with case-insensitive matching).
- Project pay workspace: **Save Project** persists header fields plus procedure checklist and pay-application notes (`project.procedure_checklist`, `project.pay_application_notes`), and creates/updates/deletes **project pay item** lines (including `pay_item_number` on create for catalog match). Phases tab is a flat per-line editor aligned with `project_pay_item` fields; installed quantities stay calendar-derived. Deleting a pay line is blocked when event quantities still reference it. Stockpile **purchased qty** remains UI-only; **stockpile billed** dollars persist.
- Projects board: lane filters use status only so every project (including default Not Started + OTHER) appears; Completed stays on `/projects/completed` only (two columns on `/projects`). Company projects list: default to **All** tab; **ProjectRow** shows code, status, type, owner, and district.
- Project workspace: opening `/projects/[companyId]/[projectId]` no longer 404s when the URL company id disagrees with a missing `customer_id` (unassigned); redirect to canonical `/projects/{customerId}/{id}` when the DB has a customer. After create, redirect uses `customer_id` or `customerId` from the API body. `ProjectWorkspaceClient` remounts per `projectId` so header state matches loaded data.
- Project workspace UX: header syncs from server props after refresh; company link + detail line in `PageHeader`; editable **Code / Owner / District / Status** with **Save**; PATCH omits blank optional fields (avoids validation errors); after successful **Save** (create or update), navigate to **`/projects`** (no in-place `router.refresh()`); Contract vs Phases tab remembered in `sessionStorage` per project.
- `PageHeader` `description` prop accepts `ReactNode` (not only string).
- Add `prisma/seed.ts` with fictitious sample customer, employees, project, pay items, invoice, event, assignments, and quantities (`npx prisma db seed`).
- SDLC Workflow Cursor extension: build with `npm run vsix` in `extensions/sdlc-workflow`, install via `cursor --install-extension ./extensions/sdlc-workflow/sdlc-workflow-0.1.0.vsix`. Desktop copy at `~/Desktop/vscode-sdlc-workflow` (optional); Apple Notes checklist in that folder under `docs/`.
- Reset Prisma migrations to gfchub baseline: remove 27 outdated migrations; keep init_gfchub_v2 and add_employee_optional_fields; init migration embeds `sql/init/gfcHubDB.sql` so fresh databases and Prisma shadow DB apply the full schema.
- Add employee optional fields (notes, role, location) to schema, API, and UI.
- Stay on grid view after creating employee (no profile sheet opens).
- Event-assignments: remove `any` from tests and mock (Prisma types and MockPrismaEventAssignment); add Postman collection in docs/postman/event-assignments.postman_collection.json.
- Add event-assignments CRUD API: GET/POST /api/event-assignments, GET/PATCH/DELETE /api/event-assignments/[id] with optional filters (event_id, employee_id), ?expanded=true (event, employee), validation, FK checks, and 409 for duplicate (event_id, employee_id); spec in docs/specs/20260206_event-assignments-api.md.
- Add events CRUD API: GET/POST /api/events, GET/PATCH/DELETE /api/events/[id] with optional filters (project_id, scope_of_work_id, payment_type_id, invoice_id), ?expanded=true, validation and API-friendly FK/date normalization; Postman collection and spec.
- Refactor API layer: shared controller helpers (`parseOptionalIntParam`, `parseExpandToInclude`), DELETE returns 204 No Content for event-quantities and project-pay-items, CustomerService trims string fields before validation, typed tests/mocks (no `any`), fix PayItem mock delegate key to `pay_item`.
- Add event-quantities CRUD API: list/create/update/delete event quantities with optional filters (`?event_id=`, `?project_pay_item_id=`) and `?expanded=true` for relations.
- Add generate-spec skill and project-pay-items API spec in `docs/specs/`.
- Add `pr-reviews/` to `.gitignore` (local-only review docs).
- Replace all `any` and `as any` with proper Prisma types in ProjectPayItem controller and service.
- Add project-pay-items CRUD API with quantity and unit rate support.
- Add missing npm dependencies (Radix UI, TanStack React Query, dnd-kit, sonner, next-themes, nodemailer, Playwright, etc.).
- Add Postman collections in `docs/postman/` for all controller APIs (customers, employees, invoices, pay-items, payment-types, project-pay-items, projects, scope-of-works).

- Improve Cursor automation:
  - Add spec-driven quality guidance and repo-specific API/style rules.
  - Migrate Cursor commands to skills and align `write-spec`/`suggest-commit-message` workflows.
