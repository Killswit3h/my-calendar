// src/lib/timezone.ts
// Centralized timezone utilities for the application.

const DEFAULT_TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? process.env.REPORT_TIMEZONE ?? 'America/New_York'

export const APP_TIMEZONE = DEFAULT_TIME_ZONE

function getFormatter(tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function getTimeZoneOffsetMs(at: Date, tz = APP_TIMEZONE): number {
  const parts = getFormatter(tz).formatToParts(at)
  const lookup = (type: string) => Number(parts.find(p => p.type === type)?.value ?? '0')
  const year = lookup('year')
  const month = lookup('month')
  const day = lookup('day')
  const hour = lookup('hour')
  const minute = lookup('minute')
  const second = lookup('second')
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  return asUtc - at.getTime()
}

function zonedDateTimeToUtcInternal(
  parts: { year: number; month: number; day: number; hour?: number; minute?: number; second?: number; millisecond?: number },
  tz = APP_TIMEZONE,
): Date {
  const { year, month, day } = parts
  const hour = parts.hour ?? 0
  const minute = parts.minute ?? 0
  const second = parts.second ?? 0
  const millisecond = parts.millisecond ?? 0
  const pretend = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond))
  const offset = getTimeZoneOffsetMs(pretend, tz)
  return new Date(pretend.getTime() - offset)
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/
const NAIVE_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/

export function zonedStartOfDayUtc(dateYmd: string, tz = APP_TIMEZONE): Date {
  if (!DATE_ONLY_RE.test(dateYmd)) {
    throw new Error(`Invalid date format: ${dateYmd}`)
  }
  const [y, m, d] = dateYmd.split('-').map(Number)
  return zonedDateTimeToUtcInternal({ year: y, month: m, day: d }, tz)
}

export function zonedEndOfDayUtc(dateYmd: string, tz = APP_TIMEZONE): Date {
  if (!DATE_ONLY_RE.test(dateYmd)) {
    throw new Error(`Invalid date format: ${dateYmd}`)
  }
  const [y, m, d] = dateYmd.split('-').map(Number)
  return zonedDateTimeToUtcInternal({ year: y, month: m, day: d + 1 }, tz)
}

export function parseAppDateTime(value: string, tz = APP_TIMEZONE): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (DATE_ONLY_RE.test(trimmed)) {
    return zonedStartOfDayUtc(trimmed, tz)
  }
  if (NAIVE_DATETIME_RE.test(trimmed)) {
    const [datePart, timePart] = trimmed.split('T')
    const [y, m, d] = datePart.split('-').map(Number)
    const [hChunk, minChunk, secChunkRaw] = timePart.split(':')
    const hour = Number(hChunk)
    const minute = Number(minChunk)
    let second = 0
    let millisecond = 0
    if (secChunkRaw) {
      const [secPart, frac] = secChunkRaw.split('.')
      second = Number(secPart)
      if (frac) {
        millisecond = Number((frac + '000').slice(0, 3))
      }
    }
    return zonedDateTimeToUtcInternal({ year: y, month: m, day: d, hour, minute, second, millisecond }, tz)
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function parseAppDateOnly(value: string, tz = APP_TIMEZONE): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (DATE_ONLY_RE.test(trimmed)) {
    return zonedStartOfDayUtc(trimmed, tz)
  }
  const parsed = parseAppDateTime(trimmed, tz)
  if (!parsed) return null
  return zonedStartOfDayUtc(formatInTimeZone(parsed, tz).date, tz)
}

export function addDaysUtc(date: Date, amount: number): Date {
  const out = new Date(date.getTime())
  out.setUTCDate(out.getUTCDate() + amount)
  return out
}

export function formatInTimeZone(date: Date, tz = APP_TIMEZONE): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const lookup = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  const year = lookup('year')
  const month = lookup('month')
  const day = lookup('day')
  const hour = lookup('hour')
  const minute = lookup('minute')
  const second = lookup('second')
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:${second}`,
  }
}

export function formatAppLocalIso(date: Date, tz = APP_TIMEZONE): string {
  const { date: ymd, time } = formatInTimeZone(date, tz)
  return `${ymd}T${time}`
}

export function intersectsUtcInterval(
  eventStart: Date,
  eventEnd: Date,
  windowStartInclusive: Date,
  windowEndExclusive: Date,
): boolean {
  return eventEnd.getTime() > windowStartInclusive.getTime() && eventStart.getTime() < windowEndExclusive.getTime()
}

export function isDateOnlyInput(value: string): boolean {
  return DATE_ONLY_RE.test(value.trim())
}
