## Summary
- Style the customers listing page to match the dashboard/calendar/projects look and feel.
- Audience: all users; surfaces: web and mobile web.
- Purpose: present all customers that currently have projects (active or completed).
- No new integrations or external systems required; no special constraints provided.
- Data: show a list of customers; no additional fields specified.
- Visual assets: none provided.

## Must align with
- Existing dashboard/calendar/projects visual system (PageHeader, glassmorphism, Material 3-inspired, dark mode).
- Existing layout paradigms: responsive, left shelf + content pane constraints where applicable.

## Out of scope / constraints
- No schema/API changes requested.
- No additional features like advanced filters, sorting, or pagination were requested.
- No new external integrations.

## Open questions
- Preferred layout variant: card grid vs. table/list? (default to list with cards matching projects style.)
- Should we include search, filters (active/completed), and sorting (A–Z/recent)?
- Pagination strategy: paged vs. “load more” vs. infinite scroll?
- Per-customer actions: click-through to detail/projects? inline actions (edit/delete)?
- Empty state copy and CTA?
- Mobile tweaks beyond responsive scaling (e.g., compact cards)?

