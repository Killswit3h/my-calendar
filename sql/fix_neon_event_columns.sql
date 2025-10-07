-- Align Neon database schema with current Prisma model for Event
-- Safe to run multiple times.

BEGIN;

-- Ensure enum types exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventType') THEN
    CREATE TYPE "EventType" AS ENUM ('GUARDRAIL','FENCE','TEMP_FENCE','HANDRAIL','ATTENUATOR');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkShift') THEN
    CREATE TYPE "WorkShift" AS ENUM ('DAY','NIGHT');
  END IF;
END $$;

-- Add missing columns (nullable first), then backfill, then enforce NOT NULL where required
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "startsAt" timestamptz;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "endsAt"   timestamptz;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "allDay"    boolean;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "location"   text;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "attachmentData" bytea;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "attachmentName" text;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "attachmentType" text;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "type"      "EventType";
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "shift"     "WorkShift";
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "checklist" jsonb;

-- Try to backfill from possible legacy columns "start" / "end"
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Event' AND column_name = 'start'
  ) THEN
    EXECUTE 'UPDATE "Event" SET "startsAt" = COALESCE("startsAt", "start")';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Event' AND column_name = 'end'
  ) THEN
    EXECUTE 'UPDATE "Event" SET "endsAt" = COALESCE("endsAt", "end")';
  END IF;
END $$;

-- If still NULL, use createdAt for startsAt and mirror to endsAt
UPDATE "Event" SET "startsAt" = COALESCE("startsAt", "createdAt") WHERE "startsAt" IS NULL;
UPDATE "Event" SET "endsAt"   = COALESCE("endsAt",   "startsAt")  WHERE "endsAt"   IS NULL;

-- Apply defaults and not-null constraints expected by Prisma
ALTER TABLE "Event" ALTER COLUMN "allDay" SET DEFAULT TRUE;
UPDATE "Event" SET "allDay" = COALESCE("allDay", TRUE) WHERE "allDay" IS NULL;
ALTER TABLE "Event" ALTER COLUMN "allDay" SET NOT NULL;

ALTER TABLE "Event" ALTER COLUMN "startsAt" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "endsAt" SET NOT NULL;

-- Helpful index
CREATE INDEX IF NOT EXISTS "Event_calendarId_startsAt_idx" ON "Event" ("calendarId","startsAt");

COMMIT;

