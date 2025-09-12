// src/app/api/todos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const runtime = 'nodejs'
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
  const updated = await prisma.$queryRawUnsafe(rewritten, ...params, id) as any[]
  return NextResponse.json(updated[0], { status: 200 })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await prisma.$executeRaw`DELETE FROM "Todo" WHERE "id" = ${id}`
  return NextResponse.json({ ok: true }, { status: 200 })
}
