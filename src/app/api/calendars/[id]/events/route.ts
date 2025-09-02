// src/app/api/calendars/[id]/events/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const events = await prisma.event.findMany({ where: { calendarId: id }, orderBy: { startsAt: "asc" } })
  return NextResponse.json(events, { status: 200 })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b?.title || !b?.startsAt || !b?.endsAt)
    return NextResponse.json({ error: "title, startsAt, endsAt required" }, { status: 400 })

  await prisma.calendar.upsert({ where: { id: calendarId }, update: {}, create: { id: calendarId, name: "Default" } })
  const event = await prisma.event.create({
    data: {
      calendarId,
      title: b.title,
      description: b.description ?? "",
      startsAt: new Date(b.startsAt),
      endsAt: new Date(b.endsAt),
      allDay: !!b.allDay,
      location: b.location ?? "",
      // @ts-ignore enum nullable
      type: b.type ?? null,
    },
  })
  return NextResponse.json(event, { status: 201 })
}
