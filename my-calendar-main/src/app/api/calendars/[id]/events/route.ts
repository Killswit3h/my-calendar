// src/app/api/calendars/[id]/events/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma, tryPrisma } from "@/lib/dbSafe"
import { uploadJson, buildEventBackupKey } from "@/server/backup"
import { Prisma } from "@prisma/client"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const rows: any[] = await tryPrisma(
    () => prisma.$queryRaw`
      SELECT "id","calendarId","title","description","startsAt","endsAt","allDay","location","type"
      FROM "Event" WHERE "calendarId" = ${id}
      ORDER BY "startsAt" ASC
    `,
    [] as any[]
  )
  const payload = rows.map((e: any) => ({
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
    // Ensure calendar exists without relying on Prisma model columns
    await prisma.$executeRaw`INSERT INTO "Calendar" ("id","name") VALUES (${calendarId}, ${"Default"}) ON CONFLICT ("id") DO NOTHING`

    const startsAt = new Date(b.start)
    const endsAt = (b.allDay ? new Date(new Date(b.end).getTime() - 86400000) : new Date(b.end))
    const newId = genId()
    const rows: any[] = await prisma.$queryRaw`
      INSERT INTO "Event" ("id","calendarId","title","description","startsAt","endsAt","allDay","location","type")
      VALUES (${newId}, ${calendarId}, ${b.title}, ${b.description ?? ""}, ${startsAt}, ${endsAt}, ${!!b.allDay}, ${b.location ?? ""}, ${b.type ?? null})
      RETURNING "id","calendarId","title","description","startsAt","endsAt","allDay","location","type"
    `
    if (!rows.length) throw new Error("Failed to insert event")
    const ev = rows[0]
    const payload = {
      id: ev.id,
      calendarId: ev.calendarId,
      title: ev.title,
      description: ev.description,
      start: ev.startsAt,
      end: ev.endsAt,
      allDay: ev.allDay,
      location: ev.location,
      type: ev.type,
    }
    ;(async () => {
      try {
        const key = buildEventBackupKey(ev.id, "create")
        await uploadJson(key, { ...payload, op: "create" })
      } catch (e) { console.error("Event create backup failed", e) }
    })()
    return NextResponse.json(payload, { status: 201 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to create event", details: msg }, { status: 500 })
  }
}
