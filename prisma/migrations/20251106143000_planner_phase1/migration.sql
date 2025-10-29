-- CreateEnum
CREATE TYPE "PlannerTaskPriority" AS ENUM ('URGENT', 'IMPORTANT', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "PlannerTaskProgress" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "PlannerPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerBucket" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "bucketId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "PlannerTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "progress" "PlannerTaskProgress" NOT NULL DEFAULT 'NOT_STARTED',
    "startAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerLabel" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "PlannerLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerTaskLabelOnTask" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "PlannerTaskLabelOnTask_pkey" PRIMARY KEY ("taskId","labelId")
);

-- CreateTable
CREATE TABLE "PlannerTaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PlannerTaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PlannerChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannerAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannerComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerActivity" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "taskId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlannerBucket_planId_order_idx" ON "PlannerBucket"("planId", "order");

-- CreateIndex
CREATE INDEX "PlannerTask_planId_bucketId_order_idx" ON "PlannerTask"("planId", "bucketId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerLabel_planId_name_key" ON "PlannerLabel"("planId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerTaskAssignment_taskId_userId_key" ON "PlannerTaskAssignment"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "PlannerBucket" ADD CONSTRAINT "PlannerBucket_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlannerPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerTask" ADD CONSTRAINT "PlannerTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlannerPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerTask" ADD CONSTRAINT "PlannerTask_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "PlannerBucket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerLabel" ADD CONSTRAINT "PlannerLabel_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlannerPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerTaskLabelOnTask" ADD CONSTRAINT "PlannerTaskLabelOnTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlannerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerTaskLabelOnTask" ADD CONSTRAINT "PlannerTaskLabelOnTask_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "PlannerLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerTaskAssignment" ADD CONSTRAINT "PlannerTaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlannerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerChecklistItem" ADD CONSTRAINT "PlannerChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlannerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerAttachment" ADD CONSTRAINT "PlannerAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlannerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerComment" ADD CONSTRAINT "PlannerComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlannerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerActivity" ADD CONSTRAINT "PlannerActivity_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlannerPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerActivity" ADD CONSTRAINT "PlannerActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlannerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
