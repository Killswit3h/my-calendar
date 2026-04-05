# Migration: `pay_application_invoice_number` on `project`

## Up

Applied by Prisma via `migration.sql` (adds nullable `VARCHAR(255)`).

## Rollback (manual)

Prisma does not run down migrations automatically. To reverse on a database that has only this migration’s schema change applied:

```sql
ALTER TABLE "project" DROP COLUMN IF EXISTS "pay_application_invoice_number";
```

Then remove this migration from `_prisma_migrations` **only** if you are realigning history in a controlled environment (e.g. local dev); production rollback should be a **new forward migration** if the column must be removed after release.
