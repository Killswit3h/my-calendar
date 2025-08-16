/*
  Warnings:

  - You are about to drop the column `color` on the `Event` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('GUARDRAIL', 'FENCE', 'TEMP_FENCE', 'HANDRAIL', 'ATTENUATOR');

-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "color",
ADD COLUMN     "attachmentData" BYTEA,
ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentType" TEXT,
ADD COLUMN     "type" "public"."EventType",
ALTER COLUMN "allDay" SET DEFAULT true;
