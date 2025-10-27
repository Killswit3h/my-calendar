-- Add new labor costing tables and supporting columns

ALTER TABLE "Employee"
  ADD COLUMN "defaultSection" "PlacementType" DEFAULT 'YARD_SHOP',
  ADD COLUMN "hourlyRate" DECIMAL(10, 2);

CREATE TABLE "EventAssignment" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "dayOverride" DATE,
  "hours" DECIMAL(4, 2),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventAssignment_event_employee_day_key"
  ON "EventAssignment"("eventId", "employeeId", "dayOverride");

CREATE INDEX "EventAssignment_employee_day_idx"
  ON "EventAssignment"("employeeId", "dayOverride");

CREATE INDEX "EventAssignment_event_day_idx"
  ON "EventAssignment"("eventId", "dayOverride");

ALTER TABLE "EventAssignment"
  ADD CONSTRAINT "EventAssignment_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventAssignment"
  ADD CONSTRAINT "EventAssignment_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HourlyRate" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "effectiveDate" DATE NOT NULL,
  "rate" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HourlyRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HourlyRate_employee_effective_date_key"
  ON "HourlyRate"("employeeId", "effectiveDate");

CREATE INDEX "HourlyRate_effective_idx"
  ON "HourlyRate"("effectiveDate");

ALTER TABLE "HourlyRate"
  ADD CONSTRAINT "HourlyRate_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LaborDaily" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventTitle" TEXT,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "assignmentId" TEXT,
  "hoursDecimal" DECIMAL(6, 2) NOT NULL,
  "regularHours" DECIMAL(6, 2) NOT NULL,
  "overtimeHours" DECIMAL(6, 2) NOT NULL,
  "rateUsd" DECIMAL(10, 2) NOT NULL,
  "regularCostUsd" DECIMAL(12, 2) NOT NULL,
  "overtimeCostUsd" DECIMAL(12, 2) NOT NULL,
  "totalCostUsd" DECIMAL(12, 2) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LaborDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LaborDaily_unique_row"
  ON "LaborDaily"("day", "eventId", "employeeId");

CREATE INDEX "LaborDaily_job_day_idx"
  ON "LaborDaily"("jobId", "day");

CREATE INDEX "LaborDaily_employee_day_idx"
  ON "LaborDaily"("employeeId", "day");

ALTER TABLE "LaborDaily"
  ADD CONSTRAINT "LaborDaily_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LaborDaily"
  ADD CONSTRAINT "LaborDaily_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

CREATE OR REPLACE VIEW "labor_daily_v" AS
SELECT
  "jobId",
  "day",
  "eventId",
  "employeeId",
  "hoursDecimal" AS hours_decimal,
  "rateUsd" AS rate_usd,
  "totalCostUsd" AS cost_usd
FROM "LaborDaily";
