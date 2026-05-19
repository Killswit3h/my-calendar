# Migration `20260517120000_project_pm_branch_invoice_suffix`

Adds optional project manager FK, branch, and per-phase invoice suffix.

## Rollback (manual)

```sql
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_project_manager_id_fkey";
DROP INDEX IF EXISTS "project_project_manager_id_idx";
ALTER TABLE "project" DROP COLUMN IF EXISTS "branch";
ALTER TABLE "project" DROP COLUMN IF EXISTS "project_manager_id";
ALTER TABLE "project_phase" DROP COLUMN IF EXISTS "invoice_suffix";
```

Then remove this migration folder, revert matching fields from `schema.prisma`, and run `npx prisma generate`.
