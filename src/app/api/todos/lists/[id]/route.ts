// src/app/api/todos/lists/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

async function findFallbackListId(currentId: string) {
  const list = await tryPrisma(
    (p) =>
      p.todoList.findFirst({
        where: {
          id: { not: currentId },
          isSmart: false,
          name: { equals: "Tasks", mode: "insensitive" },
        },
        select: { id: true },
      }),
    null as { id: string } | null,
  );
  return list?.id ?? null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const list = await tryPrisma(
    (p) =>
      p.todoList.findUnique({
        where: { id },
        select: { id: true, name: true, color: true, icon: true, isSmart: true, notificationEmail: true, notifyOnNewTask: true },
      }),
    null as {
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
      isSmart: boolean;
      notificationEmail: string | null;
      notifyOnNewTask: boolean;
    } | null,
  );

  if (!list) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updates: Record<string, any> = {};
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizeEmail = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return EMAIL_RE.test(trimmed) ? trimmed : null;
  };

  if ((body as any).name !== undefined) {
    if (list.isSmart) {
      return NextResponse.json({ error: "cannot_rename_smart_list" }, { status: 400 });
    }
    const rawName = typeof (body as any).name === "string" ? (body as any).name.trim() : "";
    if (!rawName) {
      return NextResponse.json({ error: "name_required" }, { status: 422 });
    }
    updates.name = rawName;
  }
  if ((body as any).color !== undefined) {
    updates.color = typeof (body as any).color === "string" ? (body as any).color.trim() || null : null;
  }
  if ((body as any).icon !== undefined) {
    updates.icon = typeof (body as any).icon === "string" ? (body as any).icon.trim() || null : null;
  }
  if ((body as any).notificationEmail !== undefined || (body as any).notifyOnNewTask !== undefined) {
    if (list.isSmart) {
      return NextResponse.json({ error: "cannot_configure_notifications_for_smart_list" }, { status: 400 });
    }
    const emailValue =
      (body as any).notificationEmail === null
        ? null
        : normalizeEmail((body as any).notificationEmail ?? list.notificationEmail);
    const notifyValue =
      (body as any).notifyOnNewTask !== undefined ? Boolean((body as any).notifyOnNewTask) : list.notifyOnNewTask;
    if (emailValue === null && typeof (body as any).notificationEmail === "string" && (body as any).notificationEmail.trim()) {
      return NextResponse.json({ error: "invalid_notification_email" }, { status: 422 });
    }
    if (notifyValue && !emailValue) {
      return NextResponse.json({ error: "notification_email_required" }, { status: 422 });
    }
    updates.notificationEmail = emailValue;
    updates.notifyOnNewTask = notifyValue;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(list);
  }

  const updated = await tryPrisma(
    (p) =>
      p.todoList.update({
        where: { id },
        data: updates,
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
    null,
  );

  if (!updated) {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const list = await tryPrisma(
    (p) =>
      p.todoList.findUnique({
        where: { id },
        select: { id: true, name: true, isSmart: true },
      }),
    null as { id: string; name: string; isSmart: boolean } | null,
  );
  if (!list) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (list.isSmart) {
    return NextResponse.json({ error: "cannot_delete_smart_list" }, { status: 400 });
  }

  const fallbackId = await findFallbackListId(id);
  if (!fallbackId) {
    return NextResponse.json({ error: "missing_fallback" }, { status: 409 });
  }

  await tryPrisma(
    async (p) => {
      await p.$transaction([
        p.todo.updateMany({ where: { listId: id }, data: { listId: fallbackId } }),
        p.todoList.delete({ where: { id } }),
      ]);
    },
    null,
  );

  return new NextResponse(null, { status: 204 });
}
