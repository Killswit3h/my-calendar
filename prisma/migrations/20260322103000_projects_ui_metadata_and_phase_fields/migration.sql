-- Add project metadata fields required by Projects UX
ALTER TABLE "project"
ADD COLUMN "code" VARCHAR,
ADD COLUMN "owner" VARCHAR,
ADD COLUMN "district" VARCHAR,
ADD COLUMN "project_type" VARCHAR;

-- Normalize project status defaults/values to canonical workflow states
ALTER TABLE "project"
ALTER COLUMN "status" SET DEFAULT 'Not Started';

UPDATE "project"
SET "status" = CASE
  WHEN "status" = 'ACTIVE' THEN 'In Progress'
  WHEN "status" = 'COMPLETED' THEN 'Completed'
  WHEN "status" = 'IN_PROGRESS' THEN 'In Progress'
  ELSE "status"
END
WHERE "status" IN ('ACTIVE', 'COMPLETED', 'IN_PROGRESS');

-- Add phase-style persistence fields on project_pay_item
ALTER TABLE "project_pay_item"
ADD COLUMN "ready_to_work_date" TIMESTAMP(3),
ADD COLUMN "status_date" TIMESTAMP(3),
ADD COLUMN "surveyed" BOOLEAN;
