// src/app/api/backup/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadJson, buildFullExportKey } from "@/server/backup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

type EventRow = {
  id: string
  calendarId: string
  title: string
  description: string | null
  startsAt: Date
  endsAt: Date
  allDay: boolean
  location: string | null
  type: string | null
}

export async function GET(_req: NextRequest) {
  try {
    const rows = await prisma.event.findMany({
      orderBy: { startsAt: "asc" },
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

    const events = (rows as EventRow[]).map(r => ({
      id: r.id,
      calendarId: r.calendarId,
      title: r.title,
      description: r.description ?? "",
      start: r.startsAt,
      end: r.endsAt,
      allDay: r.allDay,
      location: r.location ?? "",
      type: r.type,
    }))

    const exportedAt = new Date().toISOString()
    const payload = { exportedAt, count: events.length, events }

    const key = buildFullExportKey()
    try {
      await uploadJson(key, payload)
      return NextResponse.json({ ok: true, key, count: events.length }, { status: 200 })
    } catch (e) {
      console.error("Full export backup failed", e)
      return NextResponse.json({ ok: false, count: events.length }, { status: 200 })
    }
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e))
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

