import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

// GET /api/calendars/:id/events -> events[]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const calendarId = params.id
  const events = await prisma.event.findMany({
    where: { calendarId },
    orderBy: { startsAt: "asc" },
  })
  return NextResponse.json(events, { status: 200 })
}

// POST /api/calendars/:id/events
// body: { title, description?, startsAt, endsAt, allDay?, location?, type? }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const calendarId = params.id
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const {
    title,
    description = "",
    startsAt,
    endsAt,
    allDay = false,
    location = "",
    type = null,
  } = b

  if (!title || !startsAt || !endsAt) {
    return NextResponse.json({ error: "title, startsAt, endsAt required" }, { status: 400 })
  }

  await prisma.calendar.upsert({
    where: { id: calendarId },
    update: {},
    create: { id: calendarId, name: "Default" },
  })

  const event = await prisma.event.create({
    data: {
      calendarId,
      title,
      description,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      allDay,
      location,
      // @ts-ignore enum may be null
      type,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
