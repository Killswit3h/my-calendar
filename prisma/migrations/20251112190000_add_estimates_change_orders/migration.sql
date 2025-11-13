-- Rename legacy change order table to keep historical data
ALTER TABLE "ChangeOrder" RENAME TO "FinanceChangeOrder";
ALTER INDEX "ChangeOrder_pkey" RENAME TO "FinanceChangeOrder_pkey";
ALTER INDEX "ChangeOrder_project_status_idx" RENAME TO "FinanceChangeOrder_project_status_idx";

-- Create doc status enum
CREATE TYPE "DocStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'INVOICED');

-- Counter table for document numbering
CREATE TABLE "DocCounter" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocCounter_pkey" PRIMARY KEY ("key")
);

-- Estimates
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'DRAFT',
    "date" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "attention" TEXT,
    "shortDesc" TEXT,
    "terms" TEXT,
    "notes" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Estimate_number_key" ON "Estimate"("number");

ALTER TABLE "Estimate"
  ADD CONSTRAINT "Estimate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Estimate"
  ADD CONSTRAINT "Estimate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Estimate line items
CREATE TABLE "EstimateLineItem" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(18,6) NOT NULL,
    "uom" TEXT NOT NULL,
    "rateCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    CONSTRAINT "EstimateLineItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EstimateLineItem"
  ADD CONSTRAINT "EstimateLineItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Change orders
CREATE TABLE "ChangeOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'DRAFT',
    "date" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "baseEstimateId" TEXT,
    "reason" TEXT,
    "terms" TEXT,
    "notes" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChangeOrder_number_key" ON "ChangeOrder"("number");

ALTER TABLE "ChangeOrder"
  ADD CONSTRAINT "ChangeOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChangeOrder"
  ADD CONSTRAINT "ChangeOrder_baseEstimateId_fkey" FOREIGN KEY ("baseEstimateId") REFERENCES "Estimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Change order line items
CREATE TABLE "ChangeOrderLineItem" (
    "id" TEXT NOT NULL,
    "changeOrderId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(18,6) NOT NULL,
    "uom" TEXT NOT NULL,
    "rateCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    CONSTRAINT "ChangeOrderLineItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChangeOrderLineItem"
  ADD CONSTRAINT "ChangeOrderLineItem_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "ChangeOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Signatures
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "signerName" TEXT,
    "signerTitle" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "dataUrl" TEXT,
    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- File attachments
CREATE TABLE "FileAttachment" (
    "id" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);
