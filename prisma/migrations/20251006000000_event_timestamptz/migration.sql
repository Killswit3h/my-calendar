-- Convert existing naive timestamps to UTC-aware timestamptz using APP_TZ semantics
ALTER TABLE "Event"
  ALTER COLUMN "startsAt" TYPE timestamptz USING ("startsAt" AT TIME ZONE 'America/New_York'),
  ALTER COLUMN "endsAt" TYPE timestamptz USING ("endsAt" AT TIME ZONE 'America/New_York');

-- Index to accelerate range queries on endsAt after migration
CREATE INDEX IF NOT EXISTS "Event_endsAt_idx" ON "Event"("endsAt");
