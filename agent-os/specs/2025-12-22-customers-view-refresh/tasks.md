# Tasks – Customers View Refresh

## Prep
- [x] Confirm desired layout variant (list/table vs. card grid) and per-customer actions (click-through vs. inline).
- [x] Confirm sorting/filtering/pagination expectations, project count chips, and empty-state copy.

## UI Implementation
- [x] Align Customers page layout with Projects/Calendar: PageHeader, primary/secondary actions, glass surfaces, responsive split.
- [x] Style search input with existing glass input pattern and focus ring.
- [x] Style customer items as rounded cards with border/inner shadow; ensure buttons use tokenized primary/secondary styles.
- [x] Ensure empty state uses muted text inside the styled surface.

## Behavior
- [x] Preserve debounced search, rename, delete, and load-more behavior; verify no regressions.
- [x] Verify responsive behavior (desktop split vs. stacked mobile) with no horizontal overflow.

## QA
- [x] Test with empty list, small list, and large list (load more).
- [x] Check accessibility: focus-visible on controls, aria labels on list region, contrast in dark mode.
- [x] Smoke test on mobile viewport (touch targets ≥44px, wrapping).

