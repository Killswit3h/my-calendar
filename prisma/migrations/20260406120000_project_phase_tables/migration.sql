-- CreateTable
CREATE TABLE "project_phase" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "name" VARCHAR(255) NOT NULL,
    "locate_ticket" VARCHAR(255),
    "date_created" DATE,
    "ready_to_work_date" DATE,
    "onsite_review" BOOLEAN NOT NULL DEFAULT false,
    "surveyed" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(255),
    "status_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phase_line" (
    "id" SERIAL NOT NULL,
    "phase_id" INTEGER NOT NULL,
    "project_pay_item_id" INTEGER NOT NULL,
    "phase_quantity" DECIMAL(10,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_phase_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_phase_line_project_pay_item_id_key" ON "project_phase_line"("project_pay_item_id");

-- CreateIndex
CREATE INDEX "project_phase_project_id_idx" ON "project_phase"("project_id");

-- CreateIndex
CREATE INDEX "project_phase_line_phase_id_idx" ON "project_phase_line"("phase_id");

-- AddForeignKey
ALTER TABLE "project_phase" ADD CONSTRAINT "project_phase_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phase_line" ADD CONSTRAINT "project_phase_line_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "project_phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phase_line" ADD CONSTRAINT "project_phase_line_project_pay_item_id_fkey" FOREIGN KEY ("project_pay_item_id") REFERENCES "project_pay_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
