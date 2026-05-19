-- AlterTable
ALTER TABLE "project" ADD COLUMN "project_manager_id" INTEGER,
ADD COLUMN "branch" VARCHAR(255);

-- AlterTable
ALTER TABLE "project_phase" ADD COLUMN "invoice_suffix" VARCHAR(8);

-- CreateIndex
CREATE INDEX "project_project_manager_id_idx" ON "project"("project_manager_id");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
