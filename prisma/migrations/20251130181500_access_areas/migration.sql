-- CreateEnum
CREATE TYPE "public"."AccessArea" AS ENUM ('REPORTS_DAILY', 'REPORTS_WEEKLY', 'REPORTS_FINANCE', 'REPORTS_EXPORTS');

-- CreateTable
CREATE TABLE "public"."UserAccessArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "area" "public"."AccessArea" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAccessArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccessArea_userId_area_key" ON "public"."UserAccessArea"("userId", "area");

-- CreateIndex
CREATE INDEX "UserAccessArea_userId_idx" ON "public"."UserAccessArea"("userId");

-- CreateIndex
CREATE INDEX "UserAccessArea_area_idx" ON "public"."UserAccessArea"("area");

-- AddForeignKey
ALTER TABLE "public"."UserAccessArea" ADD CONSTRAINT "UserAccessArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;










