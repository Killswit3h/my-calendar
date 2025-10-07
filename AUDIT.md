# UI/UX Consistency Audit

Scope: App shell, calendar views, events, sidebars, tables, forms, modals, drawers, toasts, reports, mobile.

Date: current repo snapshot

## Summary

- Styling system is hybrid: Tailwind is configured but most UI relies on custom CSS with ad‑hoc tokens and inline styles. There are overlapping style sources (`src/app/globals.css` and `src/styles/calendar.css`) that both define theme variables and component rules.
- Color, radius, spacing, typography and shadows are inconsistent across files. Icons are mixed (MUI icons, inline SVG, emoji via CSS `content`).
- Dark mode appears to be the default; light mode is not defined. No `prefers-reduced-motion` handling.

## Style System

- Tailwind: `tailwind.config.ts` exists with `darkMode: 'class'`, minimal `extend`.
- Global CSS tokens (Material 3 dark mapped): `src/app/globals.css:6` defines many `--md-sys-color-*` and app tokens (`--bg`, `--fg`, `--primary`, `--border`, etc.).
- Calendar CSS also defines tokens and components: `src/styles/calendar.css:1` defines `--bg`, `--card`, etc. Duplicates/conflicts with globals.

## Typography

- Base font stack set in `src/app/globals.css:29`.
- Disparate font sizes used: 0.75rem, 0.85rem, 0.9rem, 0.95rem, 1.125rem, clamp() variants, 18px, 20px; `rg` found 34 occurrences across the repo.
- No single typographic scale abstraction; sizes appear hardcoded per component.

## Colors

- CSS variables define semantic roles in `globals.css`, but many raw hex/rgba values present (approx. 119 matches), e.g. shadows and event colors (`src/app/globals.css:287-291`), badges, reports templates.
- Job type colors defined in both `src/styles/calendar.css:16-24` and `src/app/globals.css:287-291` with different values.

## Radii

- Multiple radii observed: 6px, 8px, 10px, 12px, 14px, 16px, 20px, 999px (pills). Examples:
  - `src/app/globals.css:146,233` 12px, 16px
  - `src/styles/calendar.css:31,122,128,139,208,233` 10/12/14/20/999
  - Sidebar/inputs: `src/components/UnassignedSidebar.tsx:205,213,215,220`

## Spacing

- Mix of inline `style={{ marginTop: 12 }}` etc. (≈28 occurrences), Tailwind utilities (`p-2`, `mt-1`, `gap-2`) and custom CSS paddings.
- No unified spacing scale. Utilities appear selectively used in some components (CustomerCombobox, MonthGrid, settings) while core calendar uses custom CSS.

## Shadows

- Several ad‑hoc shadows: buttons, surfaces, modals, FAB, calendar grid; different opacities and sizes (≈19 occurrences). Examples:
  - `src/app/globals.css:115,147,177,212,235`
  - `src/styles/calendar.css:79,122,208,239`

## Components (duplicates/divergence)

- Buttons: `.btn` style exists in both `src/app/globals.css:98-132` and `src/styles/calendar.css:141-151`; not identical; duplicated API.
- Inputs/selects: bespoke styles in `calendar.css:125-133` and scattered Tailwind utility compositions (e.g., `src/components/CustomerCombobox.tsx:114,131`).
- Modal/Drawer: custom `.modal-root`, `.modal-card` in both `globals.css:224-246,294` and `styles/calendar.css:120-136`; different metrics.
- Cards/surfaces: `.surface` in both files with different radius/shadow.
- Table: no unified table component; ad‑hoc lists styled with utilities.
- Toasts/banners: MUI `Snackbar` used only on Employees page (`src/app/employees/page.tsx:413`); elsewhere `alert()` is used.

## Icons

- Mixed sources:
  - MUI Icons: `src/app/employees/page.tsx:44-49`
  - Inline SVG icons: `src/components/CalendarWithData.tsx:53-62`
  - Emoji via CSS `content`: `src/styles/calendar.css:223`

## Motion

- Button hover transitions defined; no global motion tokens; no `prefers-reduced-motion` handling found.

## A11y

- `aria-*` usage: ≈42 occurrences; sidebars and menus include roles/labels (e.g., `src/components/UnassignedSidebar.tsx`, `src/components/CalendarWithData.tsx`).
- Focus ring: present for `.btn`, inputs via `--ring` but not uniformly on all interactive elements.
- Modal focus trap/escape handling: not evident; custom modals likely lack focus management.

## Theming/Dark Mode

- Tailwind `darkMode: 'class'`, but app relies on Material‑like dark variables in `globals.css`. No light theme tokens; calendar.css duplicates theme tokens. Dark‑only today.

## Design Debt Hotspots

- Duplicate token definitions in `globals.css` and `styles/calendar.css`.
- Raw hex/rgba values scattered across CSS/JSX.
- Inline styles for layout/spacings and colors (e.g., `style={{ color: '#ef4444' }}` in `src/app/reports/page.tsx:94`).
- Mixed icon systems (MUI + inline + emoji).
- Mixed component styling approaches (utilities vs custom CSS).

---

## Prioritized Fix List

1) Tokens consolidation
- Create a single tokens source (TypeScript `design-tokens.ts`) and mirror to CSS variables. Replace duplicates in `globals.css`/`calendar.css` by referencing semantic tokens.
- Define typographic scale (11, 12, 14, 16, 20, 24, 32), spacing (4, 8, 12, 16, 24, 32), radii (4, 8, 12, 16, 24), shadows (card/hover/modal), semantic colors with dark mode.

2) Tailwind config
- Extend Tailwind theme with tokens; enable semantic color utilities; configure focus ring.

3) UI primitives (`/components/ui/*`)
- Button, Input, Select, Textarea, Card, Modal/Drawer shell, Tabs, Badge/Pill, Toast/Banner.
- Provide sizes (sm/md/lg) and states (hover/focus/active/disabled/loading) with consistent APIs.

4) Patterns (`/components/patterns/*`)
- Sidebar section, Search input, Table (sticky header, sortable), Calendar event chip.

5) Codemods & replacements
- Replace hardcoded text sizes and colors with Tailwind classes or CSS vars.
- Normalize paddings/margins to spacing scale.
- Migrate `.btn` usages to `<Button>`.
- Replace MUI icons + inline SVG with a single library (recommend `lucide-react`).

6) A11y & motion
- Add modal focus trap and Escape to close; restore focus on close.
- Add `prefers-reduced-motion` variants and motion tokens; use 150–200ms hover, 200–250ms open/close.

7) Dark/Light parity
- Introduce light theme tokens; ensure AA contrast for both.

8) Feedback layer
- Replace `alert()` with toasts/banners; error boundaries per page; skeletons for loading states.

9) Internationalization readiness
- Extract UI strings to a messages file; centralize date/time formatting with 12/24h support.

---

## Counts & References (selected)

- Tailwind utilities occurrences (approx.): 98 (mix of layout/spacing/rounded/background).
- Inline styles: ≈28 (e.g., `src/app/reports/page.tsx:54,70,94`, `src/components/CalendarWithData.tsx:1107,1155,1319,1347`).
- Raw hex/rgba: ≈119 (see `src/app/globals.css`, `src/styles/calendar.css`, `src/theme.tsx`, reports template).
- `aria-*`: ≈42 occurrences; roles spread in UnassignedSidebar and CalendarWithData menus/drawers.

This audit is intended to drive a focused design-system pass with minimal regressions and staged codemods.

