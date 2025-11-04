// src/app/api/todos/steps/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

type StepPayload = { id: string; title: string; isCompleted: boolean; position: number; todoId: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const todoId = typeof (body as any).todoId === "string" ? (body as any).todoId : null;
  if (!todoId) {
    return NextResponse.json({ error: "todo_required" }, { status: 422 });
  }
  const rawTitle = typeof (body as any).title === "string" ? (body as any).title.trim() : "";
  if (!rawTitle) {
    return NextResponse.json({ error: "title_required" }, { status: 422 });
  }

  const created = await tryPrisma(
    async (p) => {
      const aggregate = await p.todoStep.aggregate({
        _max: { position: true },
        where: { todoId },
      });
      const position = (aggregate._max.position ?? -1) + 1;
      return p.todoStep.create({
        data: {
          todoId,
          title: rawTitle,
          position,
        },
        select: { id: true, title: true, isCompleted: true, position: true, todoId: true },
      });
    },
    null,
  );

  if (!created) {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }

  return NextResponse.json(created as StepPayload, { status: 201 });
}
