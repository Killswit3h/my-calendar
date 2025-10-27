import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getPrisma } from '@/lib/db'
import { isFinanceLaborEnabled } from '@/lib/finance/config'
import { zonedStartOfDayUtc } from '@/lib/timezone'

const bodySchema = z.object({
  eventId: z.string().min(1),
  employeeId: z.string().min(1),
  dateOverride: z
    .string()
    .optional()
    .transform(value => (value ? value.trim() : undefined))
    .refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'dateOverride must be YYYY-MM-DD if provided',
    }),
  hours: z
    .union([z.string(), z.number()])
    .optional()
    .transform(value => (typeof value === 'string' ? value.trim() : value))
    .transform(value => (value === undefined || value === '' ? undefined : Number(value)))
    .refine(value => value === undefined || (Number.isFinite(value) && value >= 0 && value <= 24), {
      message: 'hours must be between 0 and 24',
    }),
  note: z
    .string()
    .optional()
    .transform(value => (value ? value.trim() : undefined)),
})

export async function POST(request: Request) {
  if (!isFinanceLaborEnabled()) {
    return NextResponse.json({ error: 'Finance labor dashboard is disabled' }, { status: 404 })
  }

  const bodyJson = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(bodyJson)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  }

  const payload = parsed.data
  const prisma = await getPrisma()

  const dayOverrideDate = payload.dateOverride ? zonedStartOfDayUtc(payload.dateOverride) : null

  const existing = await prisma.eventAssignment.findFirst({
    where: {
      eventId: payload.eventId,
      employeeId: payload.employeeId,
      dayOverride: dayOverrideDate,
    },
  })

  const data = {
    eventId: payload.eventId,
    employeeId: payload.employeeId,
    dayOverride: dayOverrideDate,
    hours: payload.hours != null ? new Prisma.Decimal(Number(payload.hours).toFixed(2)) : null,
    note: payload.note ?? null,
  }

  const record = existing
    ? await prisma.eventAssignment.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.eventAssignment.create({
        data: {
          ...data,
          id: `${payload.eventId}-${payload.employeeId}${payload.dateOverride ? `-${payload.dateOverride}` : ''}`,
        },
      })

  return NextResponse.json({
    assignment: {
      id: record.id,
      eventId: record.eventId,
      employeeId: record.employeeId,
      dateOverride: record.dayOverride ? record.dayOverride.toISOString().slice(0, 10) : null,
      hours: record.hours != null ? Number(record.hours) : null,
      note: record.note,
    },
  })
}
