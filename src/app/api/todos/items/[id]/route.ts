// src/app/api/todos/items/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function serialize(todo: any) {
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
  return NextResponse.json(serialize(todo));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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
  if ((body as any).dueAt !== undefined) {
    const date = parseDate((body as any).dueAt);
    data.dueAt = date ?? null;
  }
  if ((body as any).remindAt !== undefined) {
    const date = parseDate((body as any).remindAt);
    data.remindAt = date ?? null;
  }
  if ((body as any).repeatRule !== undefined) {
    data.repeatRule = typeof (body as any).repeatRule === "string" ? (body as any).repeatRule.trim() || null : null;
  }
  if ((body as any).position !== undefined && Number.isInteger((body as any).position)) {
    data.position = (body as any).position;
  }
  if ((body as any).listId !== undefined) {
    if (typeof (body as any).listId !== "string" || !(body as any).listId) {
      return NextResponse.json({ error: "list_required" }, { status: 422 });
    }
    data.listId = (body as any).listId;
  }

  const updated = await tryPrisma(
    async (p) => {
      const todo = await p.todo.findUnique({ where: { id }, select: { id: true, listId: true } });
      if (!todo) return null;
      if (data.listId && data.listId !== todo.listId && data.position === undefined) {
        const aggregate = await p.todo.aggregate({
          _max: { position: true },
          where: { listId: data.listId },
        });
        data.position = (aggregate._max.position ?? -1) + 1;
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

  return NextResponse.json(serialize(updated));
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const deleted = await tryPrisma(
    (p) =>
      p.todo.delete({
        where: { id },
        select: { id: true },
      }),
    null,
  );
  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
