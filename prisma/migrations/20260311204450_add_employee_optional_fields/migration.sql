-- Add optional fields to employee table: notes, role, location

ALTER TABLE "employee" 
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "role" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "location" VARCHAR(64);
