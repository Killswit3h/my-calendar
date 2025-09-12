// src/app/api/todos/[id]/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const data: any = {}
  if ("title" in b) data.title = b.title
  if ("notes" in b) data.notes = b.notes ?? null
  if ("done" in b)  data.done = !!b.done
  if ("type" in b)  data.type = b.type
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })

  try {
    const updated = await prisma.todo.update({
      where: { id },
      data,
      select: { id: true, calendarId: true, title: true, notes: true, done: true, type: true, createdAt: true },
    })
    return NextResponse.json(updated, { status: 200 })
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
    await prisma.todo.delete({ where: { id } })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
