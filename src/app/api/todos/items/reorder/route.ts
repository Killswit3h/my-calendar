// src/app/api/todos/items/reorder/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

type ReorderEntry = { id: string; position: number; listId?: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray((body as any).items)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const entries: ReorderEntry[] = (body as any).items.filter(
    (row: any): row is ReorderEntry =>
      row && typeof row.id === "string" && Number.isInteger(row.position),
  );
  if (entries.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 422 });
  }

  await tryPrisma(
    async (p) => {
      await p.$transaction(
        entries.map((entry) =>
          p.todo.update({
            where: { id: entry.id },
            data: {
              position: entry.position,
              ...(entry.listId ? { listId: entry.listId } : {}),
            },
          }),
        ),
      );
    },
    null,
  );

  return new NextResponse(null, { status: 204 });
}
