-- Rename legacy Todo table to CalendarTodo for calendar-specific tasks
ALTER TABLE "Todo" RENAME TO "CalendarTodo";

-- Rename associated index and constraints for the renamed table
ALTER INDEX "Todo_calendarId_createdAt_idx" RENAME TO "CalendarTodo_calendarId_createdAt_idx";
ALTER TABLE "CalendarTodo" RENAME CONSTRAINT "Todo_pkey" TO "CalendarTodo_pkey";
ALTER TABLE "CalendarTodo" RENAME CONSTRAINT "Todo_calendarId_fkey" TO "CalendarTodo_calendarId_fkey";

-- Create todo list tables for planner todos
CREATE TABLE "TodoList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isSmart" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TodoList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "isImportant" BOOLEAN NOT NULL DEFAULT FALSE,
    "myDay" BOOLEAN NOT NULL DEFAULT FALSE,
    "dueAt" TIMESTAMP(3),
    "remindAt" TIMESTAMP(3),
    "repeatRule" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listId" TEXT NOT NULL,
    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TodoStep" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "position" INTEGER NOT NULL DEFAULT 0,
    "todoId" TEXT NOT NULL,
    CONSTRAINT "TodoStep_pkey" PRIMARY KEY ("id")
);

-- Indexes to support ordering operations
CREATE INDEX "Todo_listId_position_idx" ON "Todo"("listId", "position");
CREATE INDEX "Todo_myDay_idx" ON "Todo"("myDay");
CREATE INDEX "Todo_isImportant_idx" ON "Todo"("isImportant");
CREATE INDEX "Todo_dueAt_idx" ON "Todo"("dueAt");
CREATE INDEX "TodoStep_todoId_position_idx" ON "TodoStep"("todoId", "position");

-- Foreign key constraints for planner todos
ALTER TABLE "Todo"
  ADD CONSTRAINT "Todo_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TodoList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TodoStep"
  ADD CONSTRAINT "TodoStep_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
