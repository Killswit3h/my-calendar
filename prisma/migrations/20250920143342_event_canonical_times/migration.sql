-- Align Event table to canonical startsAt/endsAt columns
DO $$
BEGIN
  -- Drop legacy columns if they still exist
  IF EXISTS (
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'Event'
         AND column_name = 'start'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."Event" DROP COLUMN "start"';
  END IF;

  IF EXISTS (
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'Event'
         AND column_name = 'end'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."Event" DROP COLUMN "end"';
  END IF;
END
$$;

-- Ensure canonical timestamp columns are required
ALTER TABLE "public"."Event"
  ALTER COLUMN "startsAt" SET NOT NULL,
  ALTER COLUMN "endsAt" SET NOT NULL;

-- Keep the calendar/time index aligned with startsAt
DO $$
BEGIN
  IF EXISTS (
      SELECT 1
        FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = 'Event_calendarId_start_idx'
  ) THEN
    EXECUTE 'DROP INDEX "public"."Event_calendarId_start_idx"';
  END IF;

  IF NOT EXISTS (
      SELECT 1
        FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = 'Event_calendarId_startsAt_idx'
  ) THEN
    EXECUTE 'CREATE INDEX "Event_calendarId_startsAt_idx" ON "public"."Event"("calendarId","startsAt")';
  END IF;
END
$$;
