-- Add optional YYYY-MM-DD fields used by the app for all-day and multi-day events.
ALTER TABLE "public"."Event"
  ADD COLUMN IF NOT EXISTS "startDate" VARCHAR(10);

ALTER TABLE "public"."Event"
  ADD COLUMN IF NOT EXISTS "endDate" VARCHAR(10);
