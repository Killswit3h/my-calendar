-- Allow project pay lines without a catalog pay_item; store user-entered number/description/unit on the line.

ALTER TABLE "project_pay_item" DROP CONSTRAINT "project_pay_item_pay_item_id_fkey";

ALTER TABLE "project_pay_item" ALTER COLUMN "pay_item_id" DROP NOT NULL;

ALTER TABLE "project_pay_item"
  ADD COLUMN "line_item_number" VARCHAR(255),
  ADD COLUMN "line_item_description" TEXT,
  ADD COLUMN "line_item_unit" VARCHAR(255);

ALTER TABLE "project_pay_item"
  ADD CONSTRAINT "project_pay_item_pay_item_id_fkey"
  FOREIGN KEY ("pay_item_id") REFERENCES "pay_item"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
