import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}
// src/app/api/todos/items/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { tryPrisma } from "@/lib/dbSafe";
import { parseReminderOffsets } from "@/lib/reminders";
import { anchorAllDayAtNineLocal, localISOToUTC } from "@/lib/timezone";
import { getCurrentUser } from "@/lib/session";
import { ensureUserRecord } from "@/lib/users";
import { sendTodoNotificationEmail } from "@/lib/mailer";

type TodoPayload = {
  id: string;
  title: string;
  note: string | null;
  isCompleted: boolean;
  isImportant: boolean;
  myDay: boolean;
  dueAt: string | null;
  allDay: boolean;
  dueDate: string | null;
  remindAt: string | null;
  repeatRule: string | null;
  reminderEnabled: boolean;
  reminderOffsets: number[];
  lastNotifiedAt: string | null;
  sortOrder: number;
  position: number;
  createdAt: string;
  updatedAt: string;
  listId: string;
  steps: Array<{ id: string; title: string; isCompleted: boolean; position: number }>;
};

type PlannedGroup = {
  key: string;
  label: string;
  items: TodoPayload[];
};

function serializeTodo(todo: any): TodoPayload {
  return {
    id: todo.id,
    title: todo.title,
    note: todo.note,
    isCompleted: todo.isCompleted,
    isImportant: todo.isImportant,
    myDay: todo.myDay,
    dueAt: todo.dueAt ? new Date(todo.dueAt).toISOString() : null,
    remindAt: todo.remindAt ? new Date(todo.remindAt).toISOString() : null,
    repeatRule: todo.repeatRule,
    allDay: !!todo.allDay,
    dueDate: todo.dueDate ?? null,
    reminderEnabled: !!todo.reminderEnabled,
    reminderOffsets: parseReminderOffsets(todo.reminderOffsets ?? []),
    lastNotifiedAt: todo.lastNotifiedAt ? new Date(todo.lastNotifiedAt).toISOString() : null,
    sortOrder: todo.sortOrder ?? 0,
    position: todo.position,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
    listId: todo.listId,
    steps: (todo.steps ?? []).map((step: any) => ({
      id: step.id,
      title: step.title,
      isCompleted: step.isCompleted,
      position: step.position,
    })),
  };
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function endOfWeek(date: Date) {
  const end = new Date(date);
  const day = end.getDay();
  const diff = 6 - day;
  end.setDate(end.getDate() + diff);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getPlannedBucket(due: Date, today: Date) {
  const startToday = startOfDay(today).getTime();
  const endToday = endOfDay(today).getTime();
  const tomorrowEnd = endOfDay(addDays(today, 1)).getTime();
  const weekEnd = endOfWeek(today).getTime();
  const dueTime = due.getTime();
  if (dueTime < startToday) return "overdue";
  if (dueTime <= endToday) return "today";
  if (dueTime <= tomorrowEnd) return "tomorrow";
  if (dueTime <= weekEnd) return "this_week";
  return "later";
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

const BUCKET_LABEL: Record<string, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  this_week: "This week",
  later: "Later",
};

const TODO_DETAIL_URL = (todoId: string) => `/planner/todos?todo=${todoId}`;

type SortModeParam = "manual" | "created" | "due-date" | "alphabetical" | "importance";

function normalizeSortParam(raw: string | null): SortModeParam {
  if (!raw) return "manual";
  if (raw === "created" || raw === "createdAt") return "created";
  if (raw === "due-date" || raw === "dueDate") return "due-date";
  if (raw === "alpha" || raw === "alphabetical") return "alphabetical";
  if (raw === "importance") return "importance";
  return "manual";
}

function buildOrder(sortMode: SortModeParam): Prisma.TodoOrderByWithRelationInput[] {
  switch (sortMode) {
    case "created":
      return [{ createdAt: "desc" }, { sortOrder: "asc" }, { position: "asc" }];
    case "due-date":
      return [{ dueAt: "asc" }, { createdAt: "asc" }];
    case "alphabetical":
      return [{ title: "asc" }, { createdAt: "asc" }];
    case "importance":
      return [{ isImportant: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }];
    case "manual":
    default:
      return [{ sortOrder: "asc" }, { position: "asc" }, { createdAt: "asc" }];
  }
}

function parseDate(input: unknown): Date | null {
  if (typeof input !== "string") return null;
  const candidate = new Date(input);
  if (Number.isNaN(candidate.getTime())) return null;
  return candidate;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDueFields(allDay: boolean, dueAtInput: unknown, dueDateInput: unknown): { dueAt: Date | null; dueDate: string | null } {
  if (allDay) {
    let dateText: string | null = null;
    if (typeof dueDateInput === "string") {
      dateText = dueDateInput.trim().slice(0, 10);
    } else if (typeof dueAtInput === "string") {
      dateText = dueAtInput.trim().slice(0, 10);
    }
    if (!dateText || !DATE_ONLY_RE.test(dateText)) {
      return { dueAt: null, dueDate: null };
    }
    const anchorIso = anchorAllDayAtNineLocal(dateText);
    return { dueAt: new Date(anchorIso), dueDate: dateText };
  }
  if (typeof dueAtInput === "string" && dueAtInput.trim()) {
    const iso = localISOToUTC(dueAtInput.trim());
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) {
      return { dueAt: date, dueDate: null };
    }
  }
  return { dueAt: null, dueDate: null };
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const listId = params.get("listId");
  const view = params.get("view")?.toLowerCase() ?? null;
  const sortMode = normalizeSortParam(params.get("sort"));
  const today = new Date();

  const where: any = {};
  if (listId) {
    where.listId = listId;
  }
  if (view === "myday") {
    where.myDay = true;
  } else if (view === "important") {
    where.isImportant = true;
  } else if (view === "planned") {
    where.dueAt = { not: null };
  }

  const orderBy = buildOrder(sortMode);

  const todos = await tryPrisma(
    (p) =>
      p.todo.findMany({
        where,
        include: { steps: { orderBy: { position: "asc" } } },
        orderBy,
      }),
    [] as any[],
  );

  const items = todos.map(serializeTodo);

  if (view === "planned") {
    const groupsMap = new Map<string, PlannedGroup>();
    for (const item of items) {
      const dueAt = item.dueAt ? new Date(item.dueAt) : null;
      if (!dueAt) continue;
      const bucket = getPlannedBucket(dueAt, today);
      const label = BUCKET_LABEL[bucket] ?? bucket;
      if (!groupsMap.has(bucket)) {
        groupsMap.set(bucket, { key: bucket, label, items: [] });
      }
      groupsMap.get(bucket)!.items.push(item);
    }
    const orderedKeys: Array<keyof typeof BUCKET_LABEL> = ["overdue", "today", "tomorrow", "this_week", "later"];
    const groups = orderedKeys
      .filter((key) => groupsMap.has(key))
      .map((key) => groupsMap.get(key)!);
    return NextResponse.json({ groups });
  }

  let suggestions: TodoPayload[] | undefined;
  if (view === "myday") {
    const suggestionsRows = await tryPrisma(
      (p) =>
        p.todo.findMany({
          where: {
            myDay: false,
            isCompleted: false,
            dueAt: { lte: endOfDay(today) },
          },
          include: { steps: { orderBy: { position: "asc" } } },
          orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
          take: 10,
        }),
      [] as any[],
    );
    suggestions = suggestionsRows.map(serializeTodo);
  }

  return NextResponse.json({ todos: items, suggestions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await ensureUserRecord(user);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const rawTitle = typeof (body as any).title === "string" ? (body as any).title.trim() : "";
  if (!rawTitle) {
    return NextResponse.json({ error: "title_required" }, { status: 422 });
  }
  const listId = typeof (body as any).listId === "string" ? (body as any).listId : null;
  if (!listId) {
    return NextResponse.json({ error: "list_required" }, { status: 422 });
  }

  const note = typeof (body as any).note === "string" ? (body as any).note.trim() || null : null;
  const allDay = Boolean((body as any).allDay);
  const { dueAt, dueDate } = normalizeDueFields(allDay, (body as any).dueAt, (body as any).dueDate);
  const remindAt = parseDate((body as any).remindAt);
  const repeatRule = typeof (body as any).repeatRule === "string" ? (body as any).repeatRule.trim() || null : null;
  const myDay = Boolean((body as any).myDay);
  const isImportant = Boolean((body as any).isImportant);
  const reminderEnabled = Boolean((body as any).reminderEnabled);
  const reminderOffsets = parseReminderOffsets((body as any).reminderOffsets);
  const projectId =
    typeof (body as any).projectId === "string" && (body as any).projectId.trim().length > 0
      ? (body as any).projectId.trim()
      : null;

  const created = await tryPrisma(
    async (p) => {
      const aggregate = await p.todo.aggregate({
        _max: { sortOrder: true },
        where: { listId },
      });
      const nextSortOrder = (aggregate._max.sortOrder ?? -10) + 10;
      return p.todo.create({
        data: {
          title: rawTitle,
          note,
          dueAt: dueAt ?? undefined,
          dueDate: dueDate ?? undefined,
          allDay,
          remindAt: remindAt ?? undefined,
          repeatRule,
          myDay,
          isImportant,
          reminderEnabled,
          reminderOffsets: reminderEnabled ? reminderOffsets : [],
          listId,
          position: nextSortOrder,
          sortOrder: nextSortOrder,
          projectId: projectId ?? undefined,
          updatedById: user.id,
        },
        include: {
          steps: { orderBy: { position: "asc" } },
          list: {
            select: { id: true, name: true, notificationEmail: true, notifyOnNewTask: true },
          },
        },
      });
    },
    null,
  );

  if (!created) {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }

  if (created.list?.notifyOnNewTask && created.list.notificationEmail) {
    await sendTodoNotificationEmail({
      to: created.list.notificationEmail,
      listName: created.list.name,
      todo: {
        title: created.title,
        note: created.note,
        url: TODO_DETAIL_URL(created.id),
      },
    });
  }

  return NextResponse.json(serializeTodo(created), { status: 201 });
}
