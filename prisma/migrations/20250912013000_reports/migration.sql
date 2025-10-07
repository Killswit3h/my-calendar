-- Enums
CREATE TYPE "public"."ReportKind" AS ENUM ('DAILY_PDF','DAILY_XLSX','WEEKLY_PDF');
CREATE TYPE "public"."WeeklyStatus" AS ENUM ('PENDING','SUCCESS','ERROR');

-- Tables
CREATE TABLE "public"."ReportFile" (
  "id" TEXT NOT NULL,
  "kind" "public"."ReportKind" NOT NULL,
  "reportDate" TIMESTAMP(3),
  "weekStart" TIMESTAMP(3),
  "weekEnd" TIMESTAMP(3),
  "vendor" TEXT,
  "blobUrl" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReportFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportFile_reportDate_vendor_idx" ON "public"."ReportFile"("reportDate","vendor");
CREATE INDEX "ReportFile_week_vendor_idx" ON "public"."ReportFile"("weekStart","weekEnd","vendor");

CREATE TABLE "public"."DailyReportSnapshot" (
  "id" TEXT NOT NULL,
  "reportDate" TIMESTAMP(3) NOT NULL,
  "vendor" TEXT,
  "payloadJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyReportSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DailyReportSnapshot_reportDate_vendor_idx" ON "public"."DailyReportSnapshot"("reportDate","vendor");

CREATE TABLE "public"."WeeklyReportRequest" (
  "id" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "weekEnd" TIMESTAMP(3) NOT NULL,
  "vendor" TEXT,
  "status" "public"."WeeklyStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "errorText" TEXT,
  CONSTRAINT "WeeklyReportRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeeklyReportRequest_week_vendor_idx" ON "public"."WeeklyReportRequest"("weekStart","weekEnd","vendor");

