-- Add columns used by planner todos for all-day tracking and reminders.

ALTER TABLE "public"."Todo"
  ADD COLUMN IF NOT EXISTS "allDay" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "public"."Todo"
  ADD COLUMN IF NOT EXISTS "dueDate" VARCHAR(10);

ALTER TABLE "public"."Todo"
  ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "public"."Todo"
  ADD COLUMN IF NOT EXISTS "reminderOffsets" JSONB;

ALTER TABLE "public"."Todo"
  ADD COLUMN IF NOT EXISTS "lastNotifiedAt" TIMESTAMPTZ(6);
