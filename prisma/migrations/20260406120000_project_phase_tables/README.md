# Migration `20260406120000_project_phase_tables`

Adds `project_phase` and `project_phase_line` for pay-application nested phases.

## Rollback (manual)

Run in order (respects FKs):

```sql
DROP TABLE IF EXISTS "project_phase_line";
DROP TABLE IF EXISTS "project_phase";
```

Then remove this migration folder and revert the `project_phase` / `project_phase_line` blocks from `schema.prisma`, and run `npx prisma generate`.
