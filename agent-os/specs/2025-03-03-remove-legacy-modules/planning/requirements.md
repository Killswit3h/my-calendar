## Summary
Remove all code, routes, UI, and references associated with the following modules: Todos, Documents, Finance, Finance Jobs, Estimates, Inventory. Routes should 404/redirect; no data retention/export is required. Scrub all cross-links.

## Scope
- Remove modules/features: Todos, Documents, Finance, Finance Jobs, Estimates, Inventory.
- UI: Remove navigation/sidebar links and any page entry points.
- Routing: Remove/disable routes for these modules; returning 404 is acceptable; redirect to Dashboard if preferred.
- Backend/API: Remove associated handlers/controllers/services.
- Data: No archival/export required; safe to delete related code paths. (Confirm any migrations that would drop data in a follow-up.)
- Cross-links: Remove all references from other screens (dashboards, reports, widgets).
- Auth/roles: Remove permissions or role flags tied to these modules.

## Out of Scope (assumed)
- Do not change remaining modules (Dashboard, Calendar, Projects, Employees, Reports).
- No schema drops until explicitly confirmed.

## Open Questions (to confirm)
1) Removed routes should return 404 (confirmed).
2) Identify any shared components/hooks used elsewhere before removal (owner unsure; requires audit).
3) Identify any feature flags or env vars tied to these modules for potential removal (owner unsure; requires audit).
4) Add a note to release notes/changelog about removal (confirmed).

## Visuals
No visuals provided.

