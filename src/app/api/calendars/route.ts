import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

// GET /api/calendars/:id -> { calendarId, events: [...] }
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const calendarId = params.id
  const events = await prisma.event.findMany({
    where: { calendarId },
    orderBy: { startsAt: "asc" },
  })
  return NextResponse.json({ calendarId, events }, { status: 200 })
}
