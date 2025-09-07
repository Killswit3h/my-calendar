-- CreateEnum
CREATE TYPE "public"."ShareRole" AS ENUM ('VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('GUARDRAIL', 'FENCE', 'TEMP_FENCE', 'HANDRAIL', 'ATTENUATOR');

-- CreateTable
CREATE TABLE "public"."Calendar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachmentData" BYTEA,
    "attachmentName" TEXT,
    "attachmentType" TEXT,
    "type" "public"."EventType",

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareToken" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "role" "public"."ShareRole" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Holiday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "localName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "regions" TEXT,
    "types" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showHolidays" BOOLEAN NOT NULL DEFAULT true,
    "countryCode" TEXT NOT NULL DEFAULT 'US',
    "useIcs" BOOLEAN NOT NULL DEFAULT false,
    "icsUrl" TEXT,

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_calendarId_startsAt_idx" ON "public"."Event"("calendarId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_countryCode_key" ON "public"."Holiday"("date", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_key" ON "public"."UserSetting"("userId");

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareToken" ADD CONSTRAINT "ShareToken_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
