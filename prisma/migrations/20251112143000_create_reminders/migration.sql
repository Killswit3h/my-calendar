-- Create Reminder table used by in-app notification scheduler
CREATE TABLE IF NOT EXISTS "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fireAt" TIMESTAMPTZ(6) NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Reminder_userId_entityType_entityId_idx"
  ON "Reminder"("userId","entityType","entityId");

CREATE INDEX IF NOT EXISTS "Reminder_fireAt_status_channel_idx"
  ON "Reminder"("fireAt","status","channel");
