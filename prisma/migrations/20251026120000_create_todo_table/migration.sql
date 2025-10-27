-- Create Todo table missing from baseline

CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT FALSE,
    "type" "EventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Todo_calendarId_createdAt_idx" ON "Todo"("calendarId", "createdAt");

ALTER TABLE "Todo"
  ADD CONSTRAINT "Todo_calendarId_fkey"
  FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
