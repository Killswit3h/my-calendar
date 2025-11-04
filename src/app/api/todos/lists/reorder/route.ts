// src/app/api/todos/lists/reorder/route.ts
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

type Entry = { id: string; position: number };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray((body as any).items)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const entries: Entry[] = (body as any).items.filter(
    (row: any): row is Entry => row && typeof row.id === "string" && Number.isInteger(row.position),
  );
  if (entries.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 422 });
  }

  await tryPrisma(
    async (p) => {
      await p.$transaction(
        entries.map((entry) =>
          p.todoList.update({
            where: { id: entry.id },
            data: { position: entry.position },
          }),
        ),
      );
    },
    null,
  );

  return new NextResponse(null, { status: 204 });
}
