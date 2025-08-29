import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

// PATCH /api/events/:eventId
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const data: any = {}
  if (typeof b.title === "string") data.title = b.title
  if (typeof b.startsAt === "string") data.startsAt = new Date(b.startsAt)
  if (b.endsAt !== undefined && b.endsAt !== null) data.endsAt = new Date(b.endsAt)
  if (typeof b.allDay === "boolean") data.allDay = b.allDay
  if ("description" in b) data.description = b.description ?? null
  if ("location" in b) data.location = b.location ?? null
  if ("type" in b) data.type = b.type ?? null

  const updated = await prisma.event.update({ where: { id: eventId }, data })
  return NextResponse.json(updated, { status: 200 })
}

// DELETE /api/events/:eventId
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params
  await prisma.event.delete({ where: { id: eventId } })
  return NextResponse.json({ ok: true }, { status: 200 })
}
