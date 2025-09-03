// src/app/api/calendars/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

// GET /api/calendars
export async function GET(_req: NextRequest) {
  const calendars = await prisma.calendar.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(calendars, { status: 200 })
}

// POST /api/calendars  body: { name: string }
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const cal = await prisma.calendar.create({ data: { name: String(b.name), isPrivate: true } })
  return NextResponse.json(cal, { status: 201 })
}
