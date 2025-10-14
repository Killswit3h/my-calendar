-- Operational records for the unified shell modules

CREATE TABLE "public"."Rfi" (
  "id" TEXT PRIMARY KEY,
  "project" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "assignedTo" TEXT,
  "status" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Rfi_project_status_idx" ON "public"."Rfi" ("project", "status");

CREATE TABLE "public"."ChangeOrder" (
  "id" TEXT PRIMARY KEY,
  "project" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" NUMERIC(12,2),
  "status" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ChangeOrder_project_status_idx" ON "public"."ChangeOrder" ("project", "status");

CREATE TABLE "public"."PurchaseOrder" (
  "id" TEXT PRIMARY KEY,
  "poNumber" TEXT NOT NULL,
  "project" TEXT NOT NULL,
  "vendor" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "expectedOn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "public"."PurchaseOrder" ("poNumber");
CREATE INDEX "PurchaseOrder_status_idx" ON "public"."PurchaseOrder" ("status");

CREATE TABLE "public"."InventoryTransfer" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "fromLocationId" TEXT NOT NULL,
  "toLocationId" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fulfilledAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "InventoryTransfer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryTransfer_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "public"."InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryTransfer_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "public"."InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "InventoryTransfer_status_idx" ON "public"."InventoryTransfer" ("status");
CREATE INDEX "InventoryTransfer_itemId_idx" ON "public"."InventoryTransfer" ("itemId");

CREATE TABLE "public"."Certification" (
  "id" TEXT PRIMARY KEY,
  "employeeName" TEXT NOT NULL,
  "certification" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "expiresOn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Certification_status_expires_idx" ON "public"."Certification" ("status", "expiresOn");

CREATE TABLE "public"."Vehicle" (
  "id" TEXT PRIMARY KEY,
  "unit" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "location" TEXT,
  "nextServiceOn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Vehicle_status_idx" ON "public"."Vehicle" ("status");
CREATE INDEX "Vehicle_nextService_idx" ON "public"."Vehicle" ("nextServiceOn");
