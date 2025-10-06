-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."fdot_cutoffs" (
    "id" TEXT PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "cutoff_date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "fdot_cutoffs_year_cutoff_date_key"
  ON "public"."fdot_cutoffs" ("year", "cutoff_date");
