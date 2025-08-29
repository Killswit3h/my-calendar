import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const calendarId = searchParams.get("calendarId")
  if (!calendarId) return NextResponse.json({ error: "calendarId required" }, { status: 400 })
  const events = await prisma.event.findMany({
    where: { calendarId },
    orderBy: { startsAt: "asc" },
  })
  return NextResponse.json(events, { status: 200 })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  const { calendarId, title, startsAt, endsAt, description = "", allDay = false, location = "", type = null } = b
  if (!calendarId || !title || !startsAt || !endsAt)
    return NextResponse.json({ error: "calendarId, title, startsAt, endsAt required" }, { status: 400 })

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
      // @ts-ignore nullable enum OK
      type,
    },
  })
  return NextResponse.json(event, { status: 201 })
}
