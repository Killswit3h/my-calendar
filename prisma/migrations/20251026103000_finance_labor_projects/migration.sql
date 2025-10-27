-- Add Project model and link Events to Projects/Customers

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Project_customerId_idx" ON "Project"("customerId");
CREATE UNIQUE INDEX "Project_name_customerId_key" ON "Project"("name", "customerId");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Event"
  ADD COLUMN "projectId" TEXT,
  ADD COLUMN "customerId" TEXT;

CREATE INDEX "Event_projectId_idx" ON "Event"("projectId");
CREATE INDEX "Event_customerId_idx" ON "Event"("customerId");

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
