# GFC Control Center Platform Notes

## Architecture Overview

- **App Router shell** – The application now uses a `(shell)` route group that renders the persistent top bar, sidebar navigation, and keyboard shortcuts. The existing `/calendar` routes remain unmanaged by the shell and continue to render the legacy calendar experience untouched.
- **Navigation config** – `src/lib/routes.ts` centralises primary navigation metadata (labels, icons, hotkeys, quick links). Sidebar and command palette consume this source of truth so additions happen in one place.
- **Shared UI** – Reusable building blocks live under `src/components/ui/`:
  - `TopBar`, `AppSidebar`, and `ShellHotkeys` power the layout shell.
  - `PageHeader`, `StatGrid`, `KpiCard`, `ActionQueue`, `DataTable`, and `EmptyState` provide consistent patterns across modules.
  - `ModuleTabs`/`ProjectTabs` standardise secondary navigation.
- **Dashboard data** – `src/lib/dashboard/metrics.ts` aggregates live Prisma queries (active jobs, pending invoices, low-stock inventory, crew hours). Action queue pulls from a blend of existing tables and typed fixtures.
- **Operational tables** – New Prisma models power the shell stubs (`Rfi`, `ChangeOrder`, `PurchaseOrder`, `InventoryTransfer`, `Certification`, `Vehicle`). Migration `20251015120000_operational_records` creates these tables; pages gracefully fall back to fixtures until data exists.
- **Fixtures** – `src/lib/fixtures/modules.ts` contains typed mock data for sections without backing tables yet (documents, procurement, HR, fleet, compliance, reports, admin). Swap these for live queries when schemas land.

## Theming & Design Tokens

- **CSS variables** – `src/app/globals.css` defines light/dark palettes with GFC green tokens (`--gfc-green`, `--color-bg`, `--color-surface`, etc.).
- **Tailwind config** – `tailwind.config.ts` maps Tailwind color names to the CSS tokens and exposes utility spacing/shadow tokens for the glassmorphism treatment.
- **Theme provider** – `src/app/providers.tsx` wraps the app with `next-themes`, React Query, and the updated MUI theme (see `createAppTheme`). Theme preference persists in `localStorage`, toggles via the top bar button, and writes to `document.documentElement.dataset.mode` for CSS selectors.

## Modules & Routing

Each module has a layout with tabs and a redirecting index:

- **Dashboard**: `/dashboard` with hero, KPIs, action queue, and map placeholder.
- **Calendar**: `/calendar` redirects to the default calendar ID to preserve existing behaviour.
- **Projects**: list plus project-scoped tabs (`overview`, `tasks`, `gantt`, `drawings`, `rfis`, `submittals`).
- **Documents, Finance, Inventory, Procurement, HR, Fleet, Compliance, Reports, Admin**: each has a tabbed layout with tables/cards and empty states wired to fixtures or live data.

## Shared Utilities

- `src/lib/theme.ts` – `cn` helper, brand tokens, number formatting helpers.
- `src/lib/dashboard/types.ts` – shared types for the action queue.
- React Query client lives at the provider level for future data fetching hooks.

## Testing

- **Unit**: existing Vitest suite still runs with `npm test`.
- **Playwright**: smoke tests under `tests/e2e/` cover dashboard load + theme toggle, sidebar active states, and DataTable CSV export/column resize. Run with `npm run test:e2e` (installs browsers automatically on first run).

## Adding a New Module

1. Add the module entry to `SHELL_NAV_ITEMS` in `src/lib/routes.ts`.
2. Create a route folder inside `app/(shell)/<module>` with a layout that renders `PageHeader`, optional `ModuleTabs`, and redirecting `page.tsx`.
3. Use `DataTable`, `PageHeader`, and `EmptyState` scaffolds for quick stubs. Define typed fixtures in `src/lib/fixtures/modules.ts` until a Prisma model exists.
4. Wire up any API routes or Prisma queries under `src/app/api/` or `src/lib/<module>/` as needed.
5. Extend Playwright coverage if the module adds new critical flows.
