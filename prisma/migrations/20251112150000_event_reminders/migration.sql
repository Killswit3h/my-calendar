-- Ensure Event table has reminder columns used by the API.
ALTER TABLE "public"."Event"
  ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "reminderOffsets" JSONB,
  ADD COLUMN IF NOT EXISTS "lastNotifiedAt" TIMESTAMPTZ(6);
