// src/app/api/todos/lists/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

type SmartKey = "myday" | "important" | "planned";
const SMART_NAME_KEY: Record<string, SmartKey | null> = {
  "my day": "myday",
  important: "important",
  planned: "planned",
};

type ListResponse = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  position: number;
  isSmart: boolean;
  incompleteCount: number;
  notificationEmail: string | null;
  notifyOnNewTask: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return EMAIL_RE.test(trimmed) ? trimmed : null;
}

async function getSmartCounts() {
  const [myDay, important, planned] = await Promise.all([
    tryPrisma((p) => p.todo.count({ where: { myDay: true, isCompleted: false } }), 0),
    tryPrisma((p) => p.todo.count({ where: { isImportant: true, isCompleted: false } }), 0),
    tryPrisma((p) => p.todo.count({ where: { dueAt: { not: null }, isCompleted: false } }), 0),
  ]);
  return { myDay, important, planned };
}

export async function GET() {
  const lists = await tryPrisma(
    (p) =>
      p.todoList.findMany({
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          position: true,
          isSmart: true,
          notificationEmail: true,
          notifyOnNewTask: true,
        },
      }),
    [] as Array<{
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
      position: number;
      isSmart: boolean;
      notificationEmail: string | null;
      notifyOnNewTask: boolean;
    }>,
  );

  if (lists.length === 0) {
    return NextResponse.json({ lists: [] as ListResponse[] });
  }

  const counts = await tryPrisma(
    (p) =>
      p.todo.groupBy({
        by: ["listId"],
        where: { isCompleted: false },
        _count: { _all: true },
      }),
    [] as Array<{ listId: string; _count: { _all: number } }>,
  );

  const countMap = new Map<string, number>();
  for (const entry of counts) {
    countMap.set(entry.listId, entry._count._all);
  }

  const smartCounts = await getSmartCounts();

  const payload: ListResponse[] = lists.map((list) => {
    const key = list.name ? SMART_NAME_KEY[list.name.trim().toLowerCase()] ?? null : null;
    let incomplete = countMap.get(list.id) ?? 0;
    if (list.isSmart && key) {
      if (key === "myday") incomplete = smartCounts.myDay;
      if (key === "important") incomplete = smartCounts.important;
      if (key === "planned") incomplete = smartCounts.planned;
    }
    return {
      id: list.id,
      name: list.name,
      color: list.color,
      icon: list.icon,
      position: list.position,
      isSmart: list.isSmart,
      incompleteCount: incomplete,
      notificationEmail: list.notificationEmail ?? null,
      notifyOnNewTask: list.notifyOnNewTask,
    };
  });

  return NextResponse.json({ lists: payload });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const rawName = typeof (body as any).name === "string" ? (body as any).name.trim() : "";
  if (!rawName) {
    return NextResponse.json({ error: "name_required" }, { status: 422 });
  }
  const color = typeof (body as any).color === "string" ? (body as any).color.trim() || null : null;
  const icon = typeof (body as any).icon === "string" ? (body as any).icon.trim() || null : null;
  const notificationEmail = normalizeEmail((body as any).notificationEmail);
  const notifyOnNewTask = Boolean((body as any).notifyOnNewTask);
  if (notifyOnNewTask && !notificationEmail) {
    return NextResponse.json({ error: "notification_email_required" }, { status: 422 });
  }

  const created = await tryPrisma(
    async (p) => {
      const maxPosition = await p.todoList.aggregate({ _max: { position: true } });
      const position = (maxPosition._max.position ?? -1) + 1;
      return p.todoList.create({
        data: {
          name: rawName,
          color,
          icon,
          position,
          isSmart: false,
          notificationEmail,
          notifyOnNewTask,
        },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          position: true,
          isSmart: true,
          notificationEmail: true,
          notifyOnNewTask: true,
        },
      });
    },
    null,
  );

  if (!created) {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }

  const response: ListResponse = {
    id: created.id,
    name: created.name,
    color: created.color,
    icon: created.icon,
    position: created.position,
    isSmart: created.isSmart,
    incompleteCount: 0,
    notificationEmail: created.notificationEmail ?? null,
    notifyOnNewTask: created.notifyOnNewTask,
  };

  return NextResponse.json(response, { status: 201 });
}
