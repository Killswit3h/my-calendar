// src/app/api/calendars/[id]/todos/route.ts
export const runtime = 'edge'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tryPrisma } from "@/lib/dbSafe"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  const rows = await tryPrisma(() =>
    prisma.todo.findMany({
      where: { calendarId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, calendarId: true, title: true, notes: true, done: true, type: true, createdAt: true },
    })
  , [] as any[])
  return NextResponse.json(rows, { status: 200 })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b?.title || !b?.type) return NextResponse.json({ error: "title and type required" }, { status: 400 })

  try {
    await prisma.calendar.upsert({ where: { id: calendarId }, update: {}, create: { id: calendarId, name: "Default" } })

    const created = await prisma.todo.create({
      data: {
        id: crypto.randomUUID(),
        calendarId,
        title: String(b.title),
        notes: b.notes ?? null,
        done: !!b.done,
        type: b.type,
      },
      select: { id: true, calendarId: true, title: true, notes: true, done: true, type: true, createdAt: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}
