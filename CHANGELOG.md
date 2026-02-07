# Changelog

## Unreleased

- Add event-quantities CRUD API: list/create/update/delete event quantities with optional filters (`?event_id=`, `?project_pay_item_id=`) and `?expanded=true` for relations.
- Add generate-spec skill and project-pay-items API spec in `docs/specs/`.
- Add `pr-reviews/` to `.gitignore` (local-only review docs).
- Replace all `any` and `as any` with proper Prisma types in ProjectPayItem controller and service.
- Add project-pay-items CRUD API with quantity and unit rate support.
- Add missing npm dependencies (Radix UI, TanStack React Query, dnd-kit, sonner, next-themes, nodemailer, Playwright, etc.).
- Add Postman collections in `docs/postman/` for all controller APIs (customers, employees, invoices, pay-items, payment-types, project-pay-items, projects, scope-of-works).

- Improve Cursor automation:
  - Add spec-driven quality guidance and repo-specific API/style rules.
  - Migrate Cursor commands to skills and align `write-spec`/`suggest-commit-message` workflows.
