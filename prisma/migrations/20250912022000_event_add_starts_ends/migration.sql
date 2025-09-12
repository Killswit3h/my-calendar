-- Ensure Event.startsAt / Event.endsAt exist (compat with older schemas using start/end)
ALTER TABLE "public"."Event" ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3);
ALTER TABLE "public"."Event" ADD COLUMN IF NOT EXISTS "endsAt"   TIMESTAMP(3);

-- If legacy columns exist, backfill the new ones
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Event' AND column_name = 'start'
  ) THEN
    EXECUTE 'UPDATE "public"."Event" SET "startsAt" = "start" WHERE "startsAt" IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Event' AND column_name = 'end'
  ) THEN
    EXECUTE 'UPDATE "public"."Event" SET "endsAt" = "end" WHERE "endsAt" IS NULL';
  END IF;
END $$;

-- Create index if missing (use IF NOT EXISTS guard via DO block)
DO $$ BEGIN
  PERFORM 1 FROM pg_indexes WHERE schemaname='public' AND indexname='Event_calendarId_startsAt_idx';
  IF NOT FOUND THEN
    EXECUTE 'CREATE INDEX "Event_calendarId_startsAt_idx" ON "public"."Event"("calendarId","startsAt")';
  END IF;
END $$;

