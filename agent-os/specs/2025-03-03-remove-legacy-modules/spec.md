# Spec: Remove Legacy Modules (Todos, Documents, Finance, Finance Jobs, Estimates, Inventory)

## Goal
Fully remove the listed legacy modules across UI, routes, API, and cross-links; routes should return 404. No data retention/export is required. Update release notes to reflect removal.

## Scope
- Remove features/modules: Todos, Documents, Finance, Finance Jobs, Estimates, Inventory.
- UI: Delete sidebar/nav links, entry points, and any surface references (dashboards, reports, widgets).
- Routing: Disable or remove routes; return 404 (per confirmation).
- Backend/API: Remove handlers/controllers/services tied to these modules.
- Auth/roles: Remove permissions/flags associated with these modules.
- Cross-links: Scrub references from remaining modules (Dashboard, Calendar, Projects, Employees, Reports).

## Non-Goals
- Do not alter remaining modules beyond reference removal.
- No schema drops unless explicitly approved later.
- No data export/archival.

## Behavior
- Requests to removed routes return 404.
- No redirects unless explicitly added later (default is 404).

## Data & Storage
- No data retention; associated code paths removed. If schema changes are later required, they must be explicitly approved.

## Dependencies & Shared Code (audit required)
- Identify shared components/hooks/utilities used outside these modules before removal.
- Identify feature flags/env vars tied to these modules for potential removal.

## Risks / Mitigations
- Breaking shared code: audit shared imports before deletion.
- Stray links: search for cross-links and remove.
- Auth gaps: ensure role/permission cleanup aligns with removal.

## Acceptance Criteria (outline)
- All listed modules’ UI, routes, and APIs are removed; requests return 404.
- Sidebar/nav and cross-links to these modules are removed.
- No runtime errors from missing shared components (post-audit).
- Release notes/changelog mention removal.

## Open Questions (tracked)
- Shared components/hooks to preserve? (needs audit)
- Feature flags/env vars to remove? (needs audit)

