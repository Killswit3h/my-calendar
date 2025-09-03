// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
export const runtime = "nodejs"
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
  if ("startsAt" in b) data.startsAt = new Date(b.startsAt)
  if ("endsAt" in b) data.endsAt = new Date(b.endsAt ?? b.startsAt)
  if ("allDay" in b) data.allDay = !!b.allDay
  if ("description" in b) data.description = b.description ?? null
  if ("location" in b) data.location = b.location ?? null
  if ("type" in b) data.type = b.type ?? null
  if ("checklist" in b) {
    const cleaned = cleanJson(b.checklist)
    data.checklist = cleaned === undefined ? null : cleaned
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  try {
    const updated = await prisma.event.update({ where: { id }, data })
    return NextResponse.json(updated, { status: 200 })
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    console.error("Failed to update event", e)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    console.error("Failed to delete event", e)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
