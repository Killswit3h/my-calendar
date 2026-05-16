# Migration `20260407120000_project_phase_line_multi_phase`

Allows the same `project_pay_item` in multiple phases; one row per `(phase_id, project_pay_item_id)`; adds `line_description`.

## Rollback (manual)

```sql
DROP INDEX IF EXISTS "project_phase_line_phase_id_project_pay_item_id_key";
CREATE UNIQUE INDEX "project_phase_line_project_pay_item_id_key" ON "project_phase_line"("project_pay_item_id");
ALTER TABLE "project_phase_line" DROP COLUMN IF EXISTS "line_description";
```

**Warning:** Rollback fails if any `project_pay_item_id` appears in more than one `project_phase_line` row.
