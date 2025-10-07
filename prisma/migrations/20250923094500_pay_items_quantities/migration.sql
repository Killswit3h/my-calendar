-- CreateTable
CREATE TABLE "public"."PayItem" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventQuantity" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payItemId" TEXT NOT NULL,
    "quantity" DECIMAL(18, 6) NOT NULL,
    "stationFrom" TEXT,
    "stationTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventQuantity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayItem_number_key" ON "public"."PayItem"("number");

-- CreateIndex
CREATE INDEX "EventQuantity_eventId_idx" ON "public"."EventQuantity"("eventId");

-- CreateIndex
CREATE INDEX "EventQuantity_payItemId_idx" ON "public"."EventQuantity"("payItemId");

-- AddForeignKey
ALTER TABLE "public"."EventQuantity" ADD CONSTRAINT "EventQuantity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventQuantity" ADD CONSTRAINT "EventQuantity_payItemId_fkey" FOREIGN KEY ("payItemId") REFERENCES "public"."PayItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
