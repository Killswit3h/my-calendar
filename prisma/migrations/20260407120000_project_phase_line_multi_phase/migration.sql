-- AlterTable
ALTER TABLE "project_phase_line" ADD COLUMN "line_description" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "project_phase_line_project_pay_item_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "project_phase_line_phase_id_project_pay_item_id_key" ON "project_phase_line"("phase_id", "project_pay_item_id");
