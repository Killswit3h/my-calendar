# Liquid Glass Migration Notes

Phases
1) Tokens consolidation
- Use src/styles/tokens.css and tailwind.config.ts semantic extensions everywhere.
- Remove duplicated tokens in src/styles/calendar.css and src/app/globals.css where possible.

2) Primitives adoption
- Replace `.btn` with `components/ui/Button` (primary/secondary/ghost/destructive; sm/md/lg).
- Replace ad-hoc inputs/selects with `components/ui/Input`/`Select`.
- Replace custom modals/drawers with `components/ui/Modal`.

3) Icons
- Replace MUI icons and inline SVG with a single set (lucide-react recommended). Add adapter and codemod usages.

4) Calendar polish
- Today ring using tokens; event chip via CalendarEventChip pattern; refined drag visuals using accent outline.

5) Motion & A11y
- Respect prefers-reduced-motion; ensure ESC to close and focus return on all overlays.

6) Cleanup
- Remove deprecated CSS rules and duplicates; ensure no raw hex/rgb or inline spacing/typography remain.

Verification
- Follow VERIFICATION.md to collect screenshots, run Axe, and CI guards.

