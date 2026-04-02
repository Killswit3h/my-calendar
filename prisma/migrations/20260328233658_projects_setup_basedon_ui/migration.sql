/*
  Warnings:

  - You are about to alter the column `wage_rate` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `quantity` on the `event_quantity` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `retainage` on the `project` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `contracted_quantity` on the `project_pay_item` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `unit_rate` on the `project_pay_item` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `stockpile_billed` on the `project_pay_item` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - Made the column `created_at` on table `customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_day_shift` on table `event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_contract_invoice` on table `invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_payroll` on table `project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_EEO` on table `project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_original` on table `project_pay_item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stockpile_billed` on table `project_pay_item` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_payment_type_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_project_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_scope_of_work_id_fkey";

-- DropForeignKey
ALTER TABLE "event_assignment" DROP CONSTRAINT "event_assignment_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "event_assignment" DROP CONSTRAINT "event_assignment_event_id_fkey";

-- DropForeignKey
ALTER TABLE "event_quantity" DROP CONSTRAINT "event_quantity_event_id_fkey";

-- DropForeignKey
ALTER TABLE "event_quantity" DROP CONSTRAINT "event_quantity_project_pay_item_id_fkey";

-- DropForeignKey
ALTER TABLE "project" DROP CONSTRAINT "project_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "project_pay_item" DROP CONSTRAINT "project_pay_item_pay_item_id_fkey";

-- DropForeignKey
ALTER TABLE "project_pay_item" DROP CONSTRAINT "project_pay_item_project_id_fkey";

-- AlterTable
ALTER TABLE "customer" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "wage_rate" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_updated" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "role" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "event" ALTER COLUMN "start_time" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_time" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "is_day_shift" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "event_quantity" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "invoice" ALTER COLUMN "is_contract_invoice" SET NOT NULL;

-- AlterTable
ALTER TABLE "project" ALTER COLUMN "retainage" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "is_payroll" SET NOT NULL,
ALTER COLUMN "is_EEO" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "project_pay_item" ALTER COLUMN "contracted_quantity" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "unit_rate" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "is_original" SET NOT NULL,
ALTER COLUMN "stockpile_billed" SET NOT NULL,
ALTER COLUMN "stockpile_billed" SET DATA TYPE DECIMAL(10,2);

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_pay_item" ADD CONSTRAINT "project_pay_item_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_pay_item" ADD CONSTRAINT "project_pay_item_pay_item_id_fkey" FOREIGN KEY ("pay_item_id") REFERENCES "pay_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_scope_of_work_id_fkey" FOREIGN KEY ("scope_of_work_id") REFERENCES "scope_of_work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "payment_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_assignment" ADD CONSTRAINT "event_assignment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_assignment" ADD CONSTRAINT "event_assignment_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_quantity" ADD CONSTRAINT "event_quantity_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_quantity" ADD CONSTRAINT "event_quantity_project_pay_item_id_fkey" FOREIGN KEY ("project_pay_item_id") REFERENCES "project_pay_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "event_assignment_event_id_employee_id_idx" RENAME TO "event_assignment_event_id_employee_id_key";
