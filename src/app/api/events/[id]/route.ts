// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

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
  if ("checklist" in b) data.checklist = b.checklist ?? null

  const updated = await prisma.event.update({ where: { id }, data })
  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ ok: true }, { status: 200 })
}
