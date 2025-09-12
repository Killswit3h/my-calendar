// src/app/api/calendars/[id]/events/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { prisma, tryPrisma } from "@/lib/dbSafe"
export const dynamic = "force-dynamic"
export const revalidate = 0

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const rows = await tryPrisma(() =>
    prisma.event.findMany({
      where: { calendarId: id },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        calendarId: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        location: true,
        type: true,
      },
    })
  , [] as any[])
  const payload = (rows as any[]).map((e: any) => ({
    id: e.id,
    calendarId: e.calendarId,
    title: e.title,
    description: e.description,
    start: e.startsAt,
    end: e.endsAt,
    allDay: e.allDay,
    location: e.location,
    type: e.type,
  }))
  return NextResponse.json(payload, { status: 200 })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b?.title || !b?.start || !b?.end)
    return NextResponse.json({ error: "title, start, end required" }, { status: 400 })

  try {
    // Ensure calendar exists
    await prisma.calendar.upsert({ where: { id: calendarId }, update: {}, create: { id: calendarId, name: "Default" } })

    const startsAt = new Date(b.start)
    const endsAt = (b.allDay ? new Date(new Date(b.end).getTime() - 86400000) : new Date(b.end))
    const created = await prisma.event.create({
      data: {
        calendarId,
        title: String(b.title),
        description: (b.description ?? "") || "",
        startsAt,
        endsAt,
        allDay: !!b.allDay,
        location: (b.location ?? "") || "",
        type: b.type ?? null,
      },
      select: {
        id: true,
        calendarId: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        location: true,
        type: true,
      },
    })
    const payload = {
      id: created.id,
      calendarId: created.calendarId,
      title: created.title,
      description: created.description,
      start: (created as any).startsAt,
      end: (created as any).endsAt,
      allDay: created.allDay,
      location: created.location,
      type: created.type,
    }
    return NextResponse.json(payload, { status: 201 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to create event", details: msg }, { status: 500 })
  }
}

function sanitizeChecklist(v: any): any {
  if (v === undefined || v === null) return null
  if (Array.isArray(v)) return v.map(sanitizeChecklist).filter((x) => x !== undefined)
  if (typeof v === "object") {
    const out: any = {}
    for (const k of Object.keys(v)) {
      const cv = sanitizeChecklist(v[k])
      if (cv !== undefined) out[k] = cv
    }
    return out
  }
  return v
}
