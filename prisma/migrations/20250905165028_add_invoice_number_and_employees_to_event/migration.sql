-- Add invoiceNumber and employees columns to Event
ALTER TABLE "public"."Event"
  ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "employees" JSONB;
