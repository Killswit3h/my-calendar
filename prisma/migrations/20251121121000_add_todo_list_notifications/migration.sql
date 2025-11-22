ALTER TABLE "TodoList"
    ADD COLUMN "notificationEmail" TEXT,
    ADD COLUMN "notifyOnNewTask" BOOLEAN NOT NULL DEFAULT false;

