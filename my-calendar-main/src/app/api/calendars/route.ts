// src/app/api/calendars/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma, tryPrisma } from "@/lib/dbSafe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

// GET /api/calendars
export async function GET(_req: NextRequest) {
  const calendars = await tryPrisma(() =>
    prisma.calendar.findMany({ orderBy: { createdAt: "desc" } })
  , [])
  return NextResponse.json(calendars, { status: 200 })
}

// POST /api/calendars  body: { name: string }
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.name) return NextResponse.json({ error: "name required" }, { status: 400 })
  try {
    const cal = await prisma.calendar.create({ data: { name: String(b.name), isPrivate: true } })
    return NextResponse.json(cal, { status: 201 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to create calendar" }, { status: 500 })
  }
}
