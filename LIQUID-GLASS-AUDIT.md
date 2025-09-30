# Liquid Glass UI Audit

Date: current snapshot

## Fonts & Typography
- Base stack: src/app/globals.css:29 uses system UI with SF Pro fallback.
- Sizes (approx 34 instances): 0.75rem, 0.85rem, 0.9rem, 0.95rem, 1.125rem, 18px, 20px, clamp(11px..13px) and others. Mix of Tailwind text- classes and raw CSS.
- Weights: 500/600/700 spread across titles, chips, headers (e.g., src/app/globals.css:164, src/styles/calendar.css:210).
- Line-height: not unified; body defaults, various component rules.
- Letter-spacing: occasional (e.g., brand/header), not standardized.

## Colors
- Semantic tokens exist in globals.css; duplicate token set in styles/calendar.css.
- Raw colors: ~119 hex/rgba (see src/app/globals.css:287-291; src/styles/calendar.css:3..; src/server/reports/template.ts:29; etc.).
- Tailwind arbitrary color utilities present (e.g., bg-[var(--card)]), but also direct hex in CSS.
- Non-token colors flagged: all hex/rgba not referencing var(--*) in CSS and inline styles.

## Spacing
- Inline style spacings (~28): src/app/reports/page.tsx:54,70,94; src/components/CalendarWithData.tsx:1107,1155,1319,1347; etc.
- Tailwind spacing utilities are used in settings/customers; core calendar uses custom CSS paddings.
- No single 8pt grid.

## Radii & Shadows
- Radii found: 6, 8, 10, 12, 14, 16, 20, 999 (pills). Examples: src/styles/calendar.css:73,122,128,139,208,233; src/app/globals.css:146,233.
- Shadows: ~19 ad‑hoc; buttons, surfaces, modals, FAB, menus. Examples: src/app/globals.css:115,147,177,212,235; src/styles/calendar.css:79,122,208,239.

## Components (duplicates/divergence)
- Buttons: duplicated between src/app/globals.css and src/styles/calendar.css; divergent metrics/states.
- Inputs/selects: mix of custom CSS and Tailwind utility compositions.
- Cards/surfaces: `.surface` defined in both CSS files; different radii/backgrounds.
- Modals/drawers/menus: duplicate implementations across the two CSS files.
- Toasts: only MUI Snackbar in Employees page; alerts elsewhere.

## Calendar visuals
- Day cells: styled in styles/calendar.css; today pill background (not ring); mixed color sources.
- Event chips: forced colors; truncation; Google Maps link inside. Needs unified chip component.
- Drag/resize states: custom classes for drop targets (added), FullCalendar defaults for drag/resize.

## Icons
- Mixed packs: MUI icons (src/app/employees/page.tsx:44-49), inline SVG in CalendarWithData, emoji CSS in styles/calendar.css:223.

## Motion
- Durations: basic button hover transitions; no global motion tokens; no prefers-reduced-motion handling.

## A11y
- aria-* ~42; roles across menus/drawers; focus ring on some elements; modal likely lacks robust focus trap (now added a reusable Modal primitive but not wired everywhere yet).
- ESC close: some drawers; alerts replace proper banners in places.

## Dark Mode
- Dark-only tokens; Tailwind dark class enabled; no light parity. Duplicate token definitions between CSS files.

---

## GAP LIST (Prioritized)
1) Consolidate tokens: single source for semantic colors, glass surfaces, blur, hairline, shadows, typography, spacing, radii, motion.
2) Unify components: Button/Input/Select/Textarea/Checkbox/Toggle/Tabs/Card/Modal/Drawer/Popover/Toast/Badge/Search/SegmentedControl.
3) Icon set: replace MUI/inline/emoji with one (recommend lucide-react), sizes 16/20.
4) Calendar polish: today = accent ring; event chip = glass chip + role pill; refined drag/resize visuals.
5) Motion: global durations/easing; spring presets for micro-transitions; prefers-reduced-motion support.
6) A11y: modal focus trap everywhere; ESC to close; focus return; consistent roles/labels.
7) Dark/light parity: AA contrast on glass; remove duplicate token sources.
8) Codemods: replace raw hex/rgb and inline spacing/typography; swap ad-hoc components to primitives.
9) Performance UX: virtualize large lists; debounce search 150ms; avoid layout shift.
10) Verification/CI: screenshots, Axe, and guards for design rules.

