// src/app/api/calendars/[id]/todos/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tryPrisma } from "@/lib/dbSafe"
import crypto from "node:crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

async function ensureTodoTable() {
  // Create table if it doesn't exist (avoids needing an immediate migration in dev)
  await tryPrisma(() =>
    prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Todo" (\n' +
      '  "id" text PRIMARY KEY,\n' +
      '  "calendarId" text NOT NULL,\n' +
      '  "title" text NOT NULL,\n' +
      '  "notes" text NULL,\n' +
      '  "done" boolean NOT NULL DEFAULT FALSE,\n' +
      '  "type" "EventType" NOT NULL,\n' +
      '  "createdAt" timestamptz NOT NULL DEFAULT now(),\n' +
      '  CONSTRAINT "Todo_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE\n' +
    ')'
  ), 0 as any)
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  await ensureTodoTable()
  const todos = await tryPrisma(() =>
    prisma.$queryRaw<any[]>`
      SELECT "id","calendarId","title","notes","done", ("type"::text) as "type","createdAt"
      FROM "Todo"
      WHERE "calendarId" = ${calendarId}
      ORDER BY "createdAt" DESC
    `, [] as any[])
  return NextResponse.json(todos, { status: 200 })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  const b = await req.json().catch(() => null)
  if (!b?.title || !b?.type) return NextResponse.json({ error: "title and type required" }, { status: 400 })

  try {
    await ensureTodoTable()
    await prisma.calendar.upsert({ where: { id: calendarId }, update: {}, create: { id: calendarId, name: "Default" } })

    const id = crypto.randomUUID()
    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO "Todo" ("id","calendarId","title","notes","done","type")
      VALUES (${id}, ${calendarId}, ${String(b.title)}, ${b.notes ?? null}, ${!!b.done}, ${b.type}::"EventType")
      RETURNING "id","calendarId","title","notes","done", ("type"::text) as "type","createdAt"
    `
    const todo = rows[0]
    return NextResponse.json(todo, { status: 201 })
  } catch (e: any) {
    const msg = (e?.message || "").toString()
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}
