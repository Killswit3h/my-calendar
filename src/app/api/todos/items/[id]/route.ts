// src/app/api/todos/items/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";
import { parseReminderOffsets } from "@/lib/reminders";
import { anchorAllDayAtNineLocal, localISOToUTC } from "@/lib/timezone";
import { getCurrentUser } from "@/lib/session";
import { subscribeUserToResource } from "@/lib/subscribe";
import { emitChange } from "@/lib/notify";
import { ensureUserRecord } from "@/lib/users";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
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
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return { dueAt: parsed, dueDate: null };
    }
  }
  return { dueAt: null, dueDate: null };
}

const TODO_DETAIL_URL = (todoId: string) => `/planner/todos?todo=${todoId}`;

function serializeTodo(todo: any) {
  return {
    id: todo.id,
    title: todo.title,
    note: todo.note,
    isCompleted: todo.isCompleted,
    isImportant: todo.isImportant,
    myDay: todo.myDay,
    dueAt: todo.dueAt ? new Date(todo.dueAt).toISOString() : null,
    allDay: !!todo.allDay,
    dueDate: todo.dueDate ?? null,
    remindAt: todo.remindAt ? new Date(todo.remindAt).toISOString() : null,
    repeatRule: todo.repeatRule,
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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const todo = await tryPrisma(
    (p) =>
      p.todo.findUnique({
        where: { id },
        include: { steps: { orderBy: { position: "asc" } } },
      }),
    null,
  );
  if (!todo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(serializeTodo(todo));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await ensureUserRecord(user);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const data: Record<string, any> = {};
  if ((body as any).title !== undefined) {
    const rawTitle = typeof (body as any).title === "string" ? (body as any).title.trim() : "";
    if (!rawTitle) {
      return NextResponse.json({ error: "title_required" }, { status: 422 });
    }
    data.title = rawTitle;
  }
  if ((body as any).note !== undefined) {
    data.note = typeof (body as any).note === "string" ? (body as any).note.trim() || null : null;
  }
  if ((body as any).isCompleted !== undefined) {
    data.isCompleted = Boolean((body as any).isCompleted);
    if (data.isCompleted) {
      data.myDay = false;
    }
  }
  if ((body as any).isImportant !== undefined) {
    data.isImportant = Boolean((body as any).isImportant);
  }
  if ((body as any).myDay !== undefined) {
    data.myDay = Boolean((body as any).myDay);
  }
  const hasAllDay = (body as any).allDay !== undefined;
  if (hasAllDay) {
    data.allDay = Boolean((body as any).allDay);
  }
  const dueFieldsProvided = (body as any).dueAt !== undefined || (body as any).dueDate !== undefined;
  if (dueFieldsProvided || hasAllDay) {
    const normalized = normalizeDueFields(
      hasAllDay ? Boolean((body as any).allDay) : false,
      (body as any).dueAt,
      (body as any).dueDate,
    );
    data.dueAt = normalized.dueAt ?? null;
    data.dueDate = normalized.dueDate;
  }
  if ((body as any).remindAt !== undefined) {
    const date = parseDate((body as any).remindAt);
    data.remindAt = date ?? null;
  }
  if ((body as any).repeatRule !== undefined) {
    data.repeatRule = typeof (body as any).repeatRule === "string" ? (body as any).repeatRule.trim() || null : null;
  }
  if ((body as any).reminderEnabled !== undefined) {
    const enabled = Boolean((body as any).reminderEnabled);
    data.reminderEnabled = enabled;
    if (!enabled && (body as any).reminderOffsets === undefined) {
      data.reminderOffsets = [];
    }
  }
  if ((body as any).reminderOffsets !== undefined) {
    data.reminderOffsets = parseReminderOffsets((body as any).reminderOffsets);
  }
  if ((body as any).sortOrder !== undefined && Number.isInteger((body as any).sortOrder)) {
    data.sortOrder = (body as any).sortOrder;
    data.position = (body as any).sortOrder;
  }
  if ((body as any).position !== undefined && Number.isInteger((body as any).position)) {
    data.position = (body as any).position;
    if (data.sortOrder === undefined) {
      data.sortOrder = data.position;
    }
  }
  if ((body as any).listId !== undefined) {
    if (typeof (body as any).listId !== "string" || !(body as any).listId) {
      return NextResponse.json({ error: "list_required" }, { status: 422 });
    }
    data.listId = (body as any).listId;
  }
  data.updatedById = user.id;

  const updated = await tryPrisma(
    async (p) => {
      const todo = await p.todo.findUnique({ where: { id }, select: { id: true, listId: true } });
      if (!todo) return null;
      if (data.listId && data.listId !== todo.listId && data.sortOrder === undefined) {
        const aggregate = await p.todo.aggregate({
          _max: { sortOrder: true },
          where: { listId: data.listId },
        });
        const nextSortOrder = (aggregate._max.sortOrder ?? -10) + 10;
        data.sortOrder = nextSortOrder;
        data.position = nextSortOrder;
      }
      return p.todo.update({
        where: { id },
        data,
        include: { steps: { orderBy: { position: "asc" } } },
      });
    },
    null,
  );

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await subscribeUserToResource(user.id, "Todo", updated.id);
  if (updated.projectId) {
    await subscribeUserToResource(user.id, "Project", updated.projectId);
  }
  await emitChange({
    actorId: user.id,
    resourceType: "Todo",
    resourceId: updated.id,
    kind: "todo.updated",
    title: "Todo updated",
    body: `${user.name ?? "Someone"} updated: ${updated.title}`,
    url: TODO_DETAIL_URL(updated.id),
  });

  return NextResponse.json(serializeTodo(updated));
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await ensureUserRecord(user);
  const deleted = await tryPrisma<{ id: string; title: string | null; projectId: string | null } | null>(
    (p) =>
      p.todo.delete({
        where: { id },
        select: { id: true, title: true, projectId: true },
      }),
    null,
  );
  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await tryPrisma(
    (p) =>
      p.reminder.deleteMany({
        where: { entityType: "todo", entityId: id },
      }),
    null,
  );
  await emitChange({
    actorId: user.id,
    resourceType: "Todo",
    resourceId: deleted.id,
    kind: "todo.deleted",
    title: "Todo deleted",
    body: `${user.name ?? "Someone"} deleted: ${deleted.title ?? "a todo"}`,
    url: TODO_DETAIL_URL(deleted.id),
  });

  return new NextResponse(null, { status: 204 });
}
