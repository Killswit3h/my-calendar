// src/app/api/todos/steps/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

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
  if ((body as any).isCompleted !== undefined) {
    data.isCompleted = Boolean((body as any).isCompleted);
  }
  if ((body as any).position !== undefined && Number.isInteger((body as any).position)) {
    data.position = (body as any).position;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 422 });
  }

  const updated = await tryPrisma(
    (p) =>
      p.todoStep.update({
        where: { id },
        data,
        select: { id: true, title: true, isCompleted: true, position: true, todoId: true },
      }),
    null,
  );

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const deleted = await tryPrisma(
    (p) =>
      p.todoStep.delete({
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
