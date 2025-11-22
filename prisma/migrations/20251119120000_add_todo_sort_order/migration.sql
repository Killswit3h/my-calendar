-- Create sortOrder column used for manual todo ordering
ALTER TABLE "Todo" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Seed existing rows with their previous position values
UPDATE "Todo" SET "sortOrder" = "position";

-- Helpful index for lookups within a list
CREATE INDEX "Todo_listId_sortOrder_idx" ON "Todo"("listId", "sortOrder");


