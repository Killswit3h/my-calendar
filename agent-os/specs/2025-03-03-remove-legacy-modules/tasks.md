## Tasks — Remove Legacy Modules (Todos, Documents, Finance, Finance Jobs, Estimates, Inventory)

### 1) Discovery & Audit
- Inventory shared components/hooks/utilities used by the removed modules; list any reused elsewhere.
- Identify feature flags/env vars tied to these modules; note removal impacts.
- Map all routes/endpoints (frontend + backend) for the six modules.
- Find all cross-links (sidebar, dashboards, reports, widgets, CTA buttons).

### 2) UI / Navigation Cleanup
- Remove sidebar/nav links for Todos, Documents, Finance, Finance Jobs, Estimates, Inventory.
- Remove in-app links/buttons/cards referencing these modules (dashboards, reports, widgets).
- Remove any module-specific layouts/pages/components not reused elsewhere.

### 3) Routing & Pages
- Frontend: Remove/disable pages for each module; ensure requests return 404.
- Add/confirm fallback 404 handling for old routes (no redirects unless later required).

### 4) Backend / API
- Remove API handlers/controllers/services for these modules.
- Remove module-specific background jobs/cron hooks if any.
- Remove module-specific access/role checks tied to these areas.

### 5) Data & Config
- If schema artifacts exist: prepare a follow-up plan for dropping tables/columns (only with explicit approval).
- Remove feature flags/env vars for these modules (after audit).

### 6) Cross-Link & Dependency Scrub
- Update remaining modules to eliminate imports/usage of removed components/hooks.
- Re-test pages that previously linked to these modules to confirm no broken links.

### 7) QA & Regression
- Verify all removed routes now 404.
- Smoke-test Dashboard, Calendar, Projects, Employees, Reports for regressions.
- Confirm build/lint/test pass after removals.

### 8) Release Notes
- Add changelog/release note entry documenting removal of the six modules and 404 behavior for old routes.

