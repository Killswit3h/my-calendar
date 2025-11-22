import { NextRequest, NextResponse } from "next/server";
import { tryPrisma } from "@/lib/dbSafe";

type ReorderItem = { id: string; sortOrder: number };

export async function handleTodoReorderRequest(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !Array.isArray((body as any).items)) {
      return NextResponse.json({ error: "Invalid payload, expected items array" }, { status: 400 });
    }

    const items: ReorderItem[] = (body as any).items.filter(
      (item: any): item is ReorderItem => item && typeof item.id === "string" && Number.isInteger(item.sortOrder),
    );

    if (items.length === 0) {
      return NextResponse.json({ error: "items_required" }, { status: 422 });
    }

    await tryPrisma(
      (p) =>
        p.$transaction(
          items.map((entry) =>
            p.todo.update({
              where: { id: entry.id },
              data: {
                sortOrder: entry.sortOrder,
                position: entry.sortOrder,
              },
            }),
          ),
        ),
      null,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error reordering todos", error);
    return NextResponse.json({ error: "Failed to reorder todos" }, { status: 500 });
  }
}


