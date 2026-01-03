# Customers View Refresh Spec

## Overview
- Goal: restyle the customers listing page so it matches the dashboard/calendar/projects experience (Material 3-inspired, glassmorphic, dark mode).
- Audience: all users on web and mobile web.
- Content: show all customers that have projects (active or completed). No new data beyond customer name is required.
- Constraints: no schema/API changes; stay within existing layout and theming system.

## In Scope
- Use the established layout primitives (PageHeader, cards, surfaces, rounded/glass, neutral/dark palette).
- Responsive layout that mirrors Projects: header actions + split main section.
- Customers list styled as bordered/glass cards with consistent spacing/typography.
- Support basic viewing of customers; preserve existing load-more behavior if present.
- Maintain Back/Import actions styled per primary/secondary button patterns.

## Out of Scope
- New API endpoints or schema changes.
- Advanced filtering/sorting/pagination redesigns (unless later clarified).
- New integrations or external systems.

## UX / UI
- Header: PageHeader with title “Customers”, description subtext, primary action “Import CSV”, secondary “Back”.
- Layout: grid similar to Projects—main list pane + optional secondary pane (tips/help). On narrow screens stack vertically.
- List: each customer rendered as a rounded card with border, subtle inner shadow; name in strong text; action buttons (Rename/Delete) reusing `btn` styles.
- Empty/zero state: muted text message; keep consistent padding and surface styling.
- Inputs: search box uses existing glass style (rounded, border-white/15, bg-white/5, focus ring with primary).
- Buttons: primary uses `var(--primary)` background with `var(--primary-contrast)` text; secondary bordered ghost per existing patterns.

## Data
- Uses existing `/api/customers` fetch for name list; no additional fields or transformations required.
- No changes to database or Prisma models.

## Behavior
- Debounced search (existing); list updates from SWR fetch.
- Rename/Delete retain existing confirm/prompt flows.
- Load more retains existing pagination approach.

## Accessibility
- Preserve focus styles on inputs/buttons (`focus-visible` ring).
- Maintain appropriate aria labels on regions (list region already labeled).
- Ensure sufficient color contrast in dark mode (use established tokens).

## Performance
- Keep current client-side SWR + debounced search; no additional caching changes.
- Avoid expanding layout width beyond existing container constraints.

## Risks / Edge Cases
- Large customer lists: rely on existing “load more” to prevent overfetch.
- Empty results: show muted state without layout shift.
- Mobile: verify cards and inputs wrap without horizontal scroll; keep touch targets ≥44px.

## Acceptance Criteria
- Customers page visually matches dashboard/calendar/projects styling (header, glass cards, primary/secondary actions).
- No database or API changes made.
- Search, rename, delete, and load more behave as before.
- Responsive: two-column layout on desktop; stacked on mobile with no horizontal overflow.
- Buttons use primary/secondary tokenized colors, not hardcoded hexes.
- Empty state displays muted text within the styled surface.

## Open Questions
- Confirm desired sorting/filtering and pagination style (if any upgrade needed).
- Confirm per-customer click-through target (e.g., to a customer detail or projects list).
- Confirm if we should show project counts/status chips for each customer.

