import type { EventType, WorkShift } from '@prisma/client'
import { APP_TIMEZONE } from '@/lib/timezone'

const DAY_IN_MS = 86_400_000

type MaybeDateInput = string | number | Date | null | undefined

export type EventRowLike = {
  id: string
  calendarId: string
  title: string
  description?: string | null
  start?: MaybeDateInput
  end?: MaybeDateInput
  startsAt?: MaybeDateInput
  endsAt?: MaybeDateInput
  allDay?: boolean | null
  location?: string | null
  type?: EventType | null
  shift?: WorkShift | null
  checklist?: unknown | null
  hasQuantities?: boolean | null
}

export type CalendarEventPayload = {
  id: string
  calendarId: string
  title: string
  description: string
  start: string
  end: string
  allDay: boolean
  location: string
  type: EventType | null
  shift: WorkShift | null
  checklist: unknown | null
  hasQuantities: boolean
}

function toDate(value: MaybeDateInput): Date | null {
  if (value instanceof Date) return new Date(value.getTime())
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const direct = new Date(trimmed)
    if (!Number.isNaN(direct.getTime())) return direct
    const numeric = Number(trimmed)
    if (Number.isFinite(numeric)) {
      const fromNumber = new Date(numeric)
      return Number.isNaN(fromNumber.getTime()) ? null : fromNumber
    }
  }
  return null
}

function formatAllDay(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function ensureAllDayEnd(start: Date, end: Date | null): Date {
  if (!end) return new Date(start.getTime() + DAY_IN_MS)
  const startMs = start.getTime()
  const endMs = end.getTime()
  if (Number.isNaN(endMs) || endMs <= startMs) return new Date(startMs + DAY_IN_MS)
  if (endMs - startMs < DAY_IN_MS) return new Date(startMs + DAY_IN_MS)
  return new Date(endMs)
}

export function serializeCalendarEvent(row: EventRowLike, options?: { timezone?: string }): CalendarEventPayload {
  const timezone = options?.timezone ?? APP_TIMEZONE
  const allDay = !!row.allDay
  const hasQuantities = !!(row as any).hasQuantities

  let startDate = toDate(row.start ?? row.startsAt)
  let endDate = toDate(row.end ?? row.endsAt)

  // Normalize checklist: accept object or JSON string; always return object/null
  const parsedChecklist = (() => {
    const v = (row as any).checklist as unknown
    if (typeof v === 'string') {
      try { return JSON.parse(v) } catch { return v }
    }
    return v ?? null
  })()

  if (!startDate) {
    if (allDay && endDate) {
      startDate = new Date(endDate.getTime() - DAY_IN_MS)
    } else if (endDate) {
      startDate = new Date(endDate.getTime())
    } else {
      startDate = new Date(0)
    }
  }

  if (allDay) {
    endDate = ensureAllDayEnd(startDate, endDate)
    let startText = formatAllDay(startDate, timezone)
    let endText = formatAllDay(endDate, timezone)

    // For FullCalendar, end date should be exclusive for all-day events
    // Only bump single-day events (where start equals end) to make them exclusive
    if (startText === endText) {
      const bumped = new Date(endDate.getTime() + DAY_IN_MS)
      endDate = bumped
      endText = formatAllDay(endDate, timezone)
    }

    return {
      id: String(row.id ?? ''),
      calendarId: String(row.calendarId ?? ''),
      title: row.title ?? '',
      description: row.description ?? '',
      start: startText,
      end: endText,
      allDay: true,
      location: row.location ?? '',
      type: row.type ?? null,
      shift: row.shift ?? null,
      checklist: parsedChecklist,
      hasQuantities,
    }
  }

  if (!endDate || endDate.getTime() <= startDate.getTime()) {
    endDate = new Date(startDate.getTime())
  }

  return {
    id: String(row.id ?? ''),
    calendarId: String(row.calendarId ?? ''),
    title: row.title ?? '',
    description: row.description ?? '',
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    allDay: false,
    location: row.location ?? '',
    type: row.type ?? null,
    shift: row.shift ?? null,
    checklist: parsedChecklist,
    hasQuantities,
  }
}

export function serializeCalendarEvents(rows: EventRowLike[], options?: { timezone?: string }): CalendarEventPayload[] {
  return rows.map(row => serializeCalendarEvent(row, options))
}
