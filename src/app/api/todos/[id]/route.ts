// src/app/api/todos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  // Build dynamic SET clause
  const sets: string[] = []
  const params: any[] = []
  if ("title" in b) { sets.push(`"title" = $${sets.length + 1}`); params.push(b.title) }
  if ("notes" in b) { sets.push(`"notes" = $${sets.length + 1}`); params.push(b.notes ?? null) }
  if ("done" in b)  { sets.push(`"done" = $${sets.length + 1}`);  params.push(!!b.done) }
  if ("type" in b)  { sets.push(`"type" = ($${sets.length + 1})::"EventType"`); params.push(b.type) }
  if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })

  const sql = `UPDATE "Todo" SET ${sets.join(', ')} WHERE "id" = $$ID RETURNING "id","calendarId","title","notes","done","type","createdAt"`
  const rewritten = sql.replace('$$ID', `$${params.length + 1}`)
  try {
    const updated = await prisma.$queryRawUnsafe<any[]>(rewritten, ...params, id)
    return NextResponse.json(updated[0], { status: 200 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    await prisma.$executeRaw`DELETE FROM "Todo" WHERE "id" = ${id}`
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
