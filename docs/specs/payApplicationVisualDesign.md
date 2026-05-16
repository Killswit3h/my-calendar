# Specification: Pay Application Visual Design System

## Goal
Codify the dark, glass-on-black visual language used across the Pay Application workspace (Contract / Stockpile / Change Orders / Phases) so any new section, project, or template variant can be assembled with identical look and feel.

## User Stories
- As a developer adding a new Pay Application section, I want a single reference for tokens, components, and row templates so I don't have to reverse-engineer existing screens.
- As a designer reviewing the workspace, I want every project (and the project template) to share the same hierarchy, spacing, and tone-coded states so the experience feels uniform.

## Specific Requirements

**Color Tokens**
- Page background: `bg-neutral-950` with white text.
- Section card: `border border-white/10 bg-white/5 rounded-2xl p-5` plus `shadow-[0_20px_60px_rgba(0,0,0,0.45)]` for the outermost workspace card.
- Sub-card / panel: `rounded-xl border border-white/10 bg-black/30 p-3` (or `bg-black/25` / `bg-black/20` for nested fields).
- Row pill (Contract / Stockpile / Change Orders): `rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm` with `hover:bg-white/[0.07]` and `transition`.
- Phase pay-item rows: borderless rows with `hover:bg-white/[0.04]`, `rounded-lg`, `px-3 py-2.5`.
- Muted text scale: `text-white/85` (primary), `text-white/55` / `text-white/45` (secondary), `text-white/40` (placeholder).

**Status Tones**
- Pending / Review → `bg-amber-500/15 text-amber-300`, dot `bg-amber-400`.
- Complete / Done / Approved → `bg-emerald-500/15 text-emerald-300`, dot `bg-emerald-400`.
- In Progress / Active / Started → `bg-sky-500/15 text-sky-300`, dot `bg-sky-400`.
- Hold / Block / Issue → `bg-rose-500/15 text-rose-300`, dot `bg-rose-400`.
- Empty / unknown → `bg-white/10 text-white/70`, dot `bg-white/40`.
- Progress bar tone follows the same scale: `pct >= 100` emerald, `pct >= 50` amber, `pct < 50` `bg-white/30` + `text-white/55`.

**Typography**
- Section title: `text-xs font-semibold uppercase tracking-wide text-white` with optional `text-[11px] text-white/40` subtitle (`SectionTitle` component in `PayApplicationContractView`).
- Phase header title: `text-lg font-semibold text-white`, subtitle `text-xs text-white/55`.
- Column headers: `text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40` (or `tracking-[0.14em] text-white/45` inside Phases).
- Pay-item code: `font-mono text-[11px] font-semibold tracking-tight text-white` (Contract/Stockpile/CO) or `text-[12px]` in Phases.
- Numeric cells use `tabular-nums`; emphasised actuals/installed use `text-[15px] font-semibold text-white`.
- Currency formatting: `$` + `toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })` (the `currency()` helper in `PayApplicationContractView`).

**Card Anatomy**
- Workspace section: `<section class="w-full rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[...]">` containing a top-level `mt-2 grid gap-2 lg:grid-cols-2` (or `lg:grid-cols-[2fr_1fr]` when one panel is wider).
- Each sub-card carries a `SectionTitle` then a header strip then the data list. Full-width sub-cards span via `lg:col-span-2`.
- Phase block: `rounded-2xl border border-white/10 bg-white/5 p-5` with header row (title + status pill), 4-col `FieldShell` grid, `border-t border-white/10 pt-4` divider, then pay-item table and totals row.

**Field Shell (Phases)**
- Wrapper: `rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5` with `mt-0.5` between label and value (kept compact so date inputs don't leave dead space).
- Label: `text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45`.
- Value uses bare-input style: `w-full bg-transparent text-[13px] leading-tight text-white placeholder:italic placeholder:text-white/40 focus:outline-none`.
- Date inputs add `font-mono py-0 [color-scheme:dark]` so the picker icon remains visible on dark backgrounds without inflating the cell.
- Yes/No toggles and the Status input use `text-[13px] font-semibold leading-tight`; the Status input also adopts the active tone color.
- Empty values use the placeholder `Not set`; notes placeholder is `Add notes for this phase…`.

**Row Templates**
- Contract Quantities row: `grid-cols-[78px_1fr_44px_44px_120px_44px]` → code · description · bud · act · progress bar · %. Progress bar is `h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]` with inner `h-full rounded-full transition-all duration-300` colored by tone, `Math.max(pct, 2)%` minimum width.
- Stockpile row: `grid-cols-[1fr_1.3fr_0.65fr_0.7fr_1.2fr]` rounded-full pill, with two `h-7 rounded-full` inputs (purchased + amount) sharing the same border/focus treatment.
- Change Orders row: `grid-cols-[1fr_2fr_0.6fr_0.8fr_0.9fr]` rounded-full pill, last column emphasised (`text-[15px] font-semibold tabular-nums text-white`).
- Phase pay-item row (md+): `grid-cols-[110px_minmax(0,1fr)_90px_110px_140px_60px]` → code · description · quantity · installed (input) · progress bar · %. Mobile collapses to 2-col with the progress bar and % rendered on full-width child rows (`col-span-2`).

**Inputs & Buttons**
- Standard input: `rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60`.
- Compact numeric pill input: `h-7 rounded-full border border-white/15 bg-black/30 px-2 text-center text-[12px] tabular-nums text-white`.
- Primary action button: `rounded-md bg-[rgba(18,115,24,1)] px-3 py-1 text-[11px] font-semibold text-white shadow hover:bg-[rgba(16,100,22,1)] focus-visible:ring-2 focus-visible:ring-white/30`.
- Ghost / cancel button: `rounded-md border border-white/20 px-3 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10`.
- Add-form layout: `grid grid-cols-2 gap-1.5 rounded-lg border border-white/15 bg-black/25 p-2`, all inputs get `min-w-0`, action row spans `col-span-2 flex justify-end gap-1`.

**Header Strips & Totals**
- Section header: small uppercase tracked title on the left, summary on the right (`text-[11px] tabular-nums text-white/55`) with the format `N items · X of Y installed`.
- Column header strip aligns with the row grid via identical `grid-cols-[…]` and matching `px-3 py-1` padding.
- Total row mirrors the row grid, sits above a `border-t border-white/10 pt-3 mt-2`, uses `font-semibold text-white` for the label and the same tone scale for the overall % cell.

**Composition Rules**
- Outer page wrapper: `mx-auto flex w-full max-w-[1900px] flex-col gap-3` inside a `min-h-screen bg-neutral-950 px-4 py-6 text-white sm:px-6` `<main>`.
- Workspace cards stack vertically with `gap-3`; their internal sub-grids use `gap-2`. Stick to these spacings—no ad-hoc `gap-4` / `gap-6` inside a section.
- Borders are always `white/10`; never introduce solid white or colored hairlines except when conveying status.
- Backgrounds layer darker as you nest (`bg-white/5` → `bg-black/20` → `bg-black/25` → `bg-black/30`); maintain that order so depth reads correctly.
- Every focusable control includes the same focus ring (`focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/60` or `focus-visible:ring-2 focus-visible:ring-blue-400/60`).

## Visual Design

**Contract Quantities / Stockpile / Change Orders (`PayApplicationContractView`)**
- Section card hosts two-column grid; Contract Quantities + Notes share row 1, Stockpile + Change Orders share row 2 (CO spans both columns).
- Each list uses the rounded-full pill row with mono code, truncated description, tabular-nums values, progress bar, and tone-coded percent.
- Add-pay-item form sits above the Contract Quantities list as a 2-row sub-card so it cannot overflow its parent column.

**Phase Card (`PayApplicationPhasesView`)**
- Header: large phase name + subtitle on the left, color-coded status pill (dot + label) on the right.
- 4-col field grid: Locate Ticket # spans 2, then Date Created · Ready to Work · Onsite Review · Surveyed · Status · Status Date, finally Notes spans the full width.
- Pay-items section opens with a horizontal divider, header strip showing item count and `installed of total`, then column headers, then rows with editable `installedQty` input and tone-coded progress.
- Total row is right-aligned, hidden on mobile (`md:grid`), and shows quantity sum, installed sum, and the overall percent in tone color.

## Existing Code to Leverage

**`src/components/project/PayApplicationContractView.tsx`**
- Contains the canonical `SectionTitle`, `currency()`, `STATUS_LABEL`/`STATUS_CLASS` helpers and the rounded-full pill row pattern. Reuse these instead of redefining.
- Holds the Contract Quantities progress-bar tone logic (`pct >= 100 / >= 50 / else`) which other lists should reuse verbatim.

**`src/components/project/PayApplicationPhasesView.tsx`**
- Defines `statusTone()` and the `FieldShell` component. Any new metadata block should compose with `FieldShell` to inherit the label/value treatment automatically.
- Demonstrates the totals-row pattern (sum + tone-coded percent) that any list-with-progress section should follow.

**`src/components/project/payApplicationConstants.ts`**
- Exports `PAY_ITEM_LABEL` and `CHECKLIST_ITEMS`. Always reference `PAY_ITEM_LABEL` for column headers so we stay consistent if the label is rebranded.

**`src/components/project/payApplicationTypes.ts`**
- Source of truth for `Phase`, `PhaseItem`, `StockpileEntry`, `NewContractItem`, `ChecklistStatus`. New sections should extend these rather than introducing parallel types.

**`src/lib/theme.ts` (`cn`)**
- Use `cn(...)` for every conditional className combination so tone variants merge cleanly with the base classes without string concatenation bugs.

## Out of Scope
- Light-mode or alternate-theme variants — the spec assumes the dark workspace only.
- Animation / motion design beyond the existing `transition` and `transition-all duration-300` on progress bars.
- Mobile-first redesign of the row tables; current breakpoints (`md:` and `lg:`) are sufficient.
- Replacement of the green primary button color (`rgba(18,115,24,1)`) — keep it until brand tokens are introduced.
- New status semantics — the four tone buckets (pending / complete / progress / hold) cover current needs.
- Iconography changes; only the status dot is required.
- Backend / data-shape changes; this spec is presentational.
- Charts or analytics views; this spec covers list/table/field surfaces only.
