// src/app/api/events/[id]/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"
export const revalidate = 0

function cleanJson(v: any): any {
  if (v === undefined) return undefined
  if (v === null) return null
  if (Array.isArray(v)) return v.map(cleanJson).filter((x) => x !== undefined)
  if (typeof v === "object") {
    const out: any = {}
    for (const k of Object.keys(v)) {
      const cv = cleanJson(v[k])
      if (cv !== undefined) out[k] = cv
    }
    return out
  }
  return v
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const data: any = {}
  if ("title" in b) data.title = b.title
  let startsAt: Date | undefined
  let endsAt: Date | undefined
  if ("start" in b) startsAt = new Date(b.start)
  if ("end" in b) endsAt = new Date(b.end ?? b.start)
  const isAllDay = ("allDay" in b) ? !!b.allDay : undefined
  if (isAllDay && endsAt) {
    // Convert FullCalendar exclusive end to inclusive end for storage
    endsAt = new Date(endsAt.getTime() - 86400000)
  }
  if (startsAt) data.startsAt = startsAt
  if (endsAt) data.endsAt = endsAt
  if ("allDay" in b) data.allDay = !!b.allDay
  if ("description" in b) data.description = b.description ?? null
  if ("location" in b) data.location = b.location ?? null
  if ("type" in b) data.type = b.type ?? null
  // Note: shift and checklist are not persisted (column not present)
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  try {
    const updated = await prisma.event.update({
      where: { id },
      data,
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
      id: updated.id,
      calendarId: (updated as any).calendarId,
      title: updated.title,
      description: updated.description,
      start: (updated as any).startsAt,
      end: (updated as any).endsAt,
      allDay: updated.allDay,
      location: updated.location,
      type: updated.type,
    }
    return NextResponse.json(payload, { status: 200 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    if (msg.includes("P2025") || msg.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    console.error("Failed to update event", e)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    // Limit returned fields to avoid selecting non-existent DB columns
    await prisma.event.delete({ where: { id }, select: { id: true } })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    if (msg.includes("P2025") || msg.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    console.error("Failed to delete event", e)
    return NextResponse.json({ error: "Failed to delete event", details: msg }, { status: 500 })
  }
}
