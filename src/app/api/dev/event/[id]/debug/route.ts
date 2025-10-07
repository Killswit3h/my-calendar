// src/app/api/dev/event/[id]/debug/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { APP_TZ } from '@/lib/appConfig'

type DebugRow = {
  id: string
  startsAt: Date | null
  endsAt: Date | null
  allDay: boolean
  startsAtEt: unknown
  endsAtEt: unknown
}

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null
  const cloned = new Date(value)
  return Number.isNaN(cloned.getTime()) ? null : cloned.toISOString()
}

function toDisplay(value: unknown): string | null {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString()
  const str = String(value)
  const parsed = new Date(str)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return str
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const prisma = await getPrisma()

  const rows = (await prisma.$queryRaw(
    Prisma.sql`
      SELECT
        "Event"."id",
        "Event"."startsAt",
        "Event"."endsAt",
        "Event"."allDay",
        ("Event"."startsAt" AT TIME ZONE ${APP_TZ}) AS "startsAtEt",
        ("Event"."endsAt" AT TIME ZONE ${APP_TZ}) AS "endsAtEt"
      FROM "Event"
      WHERE "Event"."id" = ${id}
      LIMIT 1
    `
  )) as DebugRow[]

  if (!rows.length) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const row = rows[0]
  return NextResponse.json({
    id: row.id,
    allDay: !!row.allDay,
    startsAt: toIso(row.startsAt),
    endsAt: toIso(row.endsAt),
    startsAt_ET: toDisplay(row.startsAtEt),
    endsAt_ET: toDisplay(row.endsAtEt),
  })
}
