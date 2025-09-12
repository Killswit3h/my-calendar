-- Add WorkShift enum if missing, and add missing columns to Event
DO $$ BEGIN
  CREATE TYPE "public"."WorkShift" AS ENUM ('DAY','NIGHT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."Event"
  ADD COLUMN IF NOT EXISTS "shift" "public"."WorkShift",
  ADD COLUMN IF NOT EXISTS "checklist" JSONB;

