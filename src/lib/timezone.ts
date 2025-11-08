// src/lib/timezone.ts
// Centralized timezone utilities for the application.

import { format as formatTz, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { APP_TZ } from './appConfig'

export { APP_TZ } from './appConfig'

export const APP_TIMEZONE = APP_TZ

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

export function getTimeZoneOffsetMs(at: Date, tz = APP_TZ): number {
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
  tz = APP_TZ,
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

function normalizeLocalIso(input: string): string {
  if (DATE_ONLY_RE.test(input)) {
    return `${input}T00:00:00`
  }
  if (NAIVE_DATETIME_RE.test(input)) {
    const [datePart, timePartRaw = '00:00'] = input.split('T')
    const timeParts = timePartRaw.split(':')
    if (timeParts.length === 2) {
      return `${datePart}T${timeParts[0]}:${timeParts[1]}:00`
    }
    return input
  }
  return input
}

export function localISOToUTC(localISO: string, tz: string = APP_TZ): string {
  const trimmed = localISO?.trim?.() ?? ''
  if (!trimmed) {
    throw new Error('localISOToUTC requires a non-empty string')
  }
  const normalized = normalizeLocalIso(trimmed)
  const utcDate = fromZonedTime(normalized, tz)
  return utcDate.toISOString()
}

export function utcISOToLocalDate(utcInput: string | Date, tz: string = APP_TZ): Date {
  const source = typeof utcInput === 'string' ? new Date(utcInput) : utcInput
  if (!(source instanceof Date) || Number.isNaN(source.getTime())) {
    throw new Error(`utcISOToLocalDate received invalid date: ${String(utcInput)}`)
  }
  return toZonedTime(source, tz)
}

export function formatLocal(dateInput: string | Date, pattern = "yyyy-MM-dd'T'HH:mm", tz: string = APP_TZ): string {
  const source = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (!(source instanceof Date) || Number.isNaN(source.getTime())) {
    throw new Error(`formatLocal received invalid date: ${String(dateInput)}`)
  }
  return formatTz(toZonedTime(source, tz), pattern, { timeZone: tz })
}

export function nextDateISO(dateISO: string, tz: string = APP_TZ): string {
  if (!DATE_ONLY_RE.test(dateISO)) {
    throw new Error(`Invalid date format supplied to nextDateISO: ${dateISO}`)
  }
  const startUtc = fromZonedTime(`${dateISO}T00:00:00`, tz)
  const nextUtc = new Date(startUtc.getTime())
  nextUtc.setUTCDate(nextUtc.getUTCDate() + 1)
  return formatTz(toZonedTime(nextUtc, tz), 'yyyy-MM-dd', { timeZone: tz })
}

export function zonedStartOfDayUtc(dateYmd: string, tz: string = APP_TZ): Date {
  if (!DATE_ONLY_RE.test(dateYmd)) {
    throw new Error(`Invalid date format: ${dateYmd}`)
  }
  return new Date(localISOToUTC(`${dateYmd}T00:00:00`, tz))
}

export function zonedEndOfDayUtc(dateYmd: string, tz: string = APP_TZ): Date {
  const start = zonedStartOfDayUtc(dateYmd, tz)
  start.setUTCDate(start.getUTCDate() + 1)
  return start
}

export function parseAppDateTime(value: string, tz: string = APP_TZ): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (DATE_ONLY_RE.test(trimmed) || NAIVE_DATETIME_RE.test(trimmed)) {
    return new Date(localISOToUTC(trimmed, tz))
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function parseAppDateOnly(value: string, tz: string = APP_TZ): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (DATE_ONLY_RE.test(trimmed)) {
    return new Date(localISOToUTC(`${trimmed}T00:00:00`, tz))
  }
  const parsed = parseAppDateTime(trimmed, tz)
  if (!parsed) return null
  const { date } = formatInTimeZone(parsed, tz)
  return new Date(localISOToUTC(`${date}T00:00:00`, tz))
}

export function addDaysUtc(date: Date, amount: number): Date {
  const out = new Date(date.getTime())
  out.setUTCDate(out.getUTCDate() + amount)
  return out
}

export function formatInTimeZone(date: Date, tz: string = APP_TZ): { date: string; time: string } {
  const zoned = utcISOToLocalDate(date, tz)
  return {
    date: formatTz(zoned, 'yyyy-MM-dd', { timeZone: tz }),
    time: formatTz(zoned, 'HH:mm:ss', { timeZone: tz }),
  }
}

export function formatAppLocalIso(date: Date, tz: string = APP_TZ): string {
  return formatLocal(date, "yyyy-MM-dd'T'HH:mm:ss", tz)
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

export function anchorAllDayAtNineLocal(startDateYYYYMMDD: string, tz: string = APP_TZ): string {
  const trimmed = startDateYYYYMMDD?.trim?.()
  if (!trimmed || !DATE_ONLY_RE.test(trimmed)) {
    throw new Error('startDate required as YYYY-MM-DD')
  }
  const localISO = `${trimmed}T09:00:00`
  return localISOToUTC(localISO, tz)
}

export function computeReminderTimes(params: {
  allDay: boolean
  startAtUTC?: string
  startDate?: string
  offsetsMinutes: number[]
  tz?: string
}): string[] {
  const { allDay, startAtUTC, startDate, offsetsMinutes, tz = APP_TZ } = params
  if (!offsetsMinutes?.length) return []

  const uniqueOffsets = Array.from(
    new Set(offsetsMinutes.filter(m => Number.isFinite(m) && m >= 0).map(m => Math.floor(m))),
  ).sort((a, b) => a - b)
  if (!uniqueOffsets.length) return []

  const baseISO = allDay ? anchorAllDayAtNineLocal(requireString(startDate, 'startDate'), tz) : requireString(startAtUTC, 'startAtUTC')
  const baseMs = new Date(baseISO).getTime()
  if (Number.isNaN(baseMs)) {
    throw new Error('Invalid base reminder time')
  }

  return uniqueOffsets.map(offsetMinutes => new Date(baseMs - offsetMinutes * 60_000).toISOString())
}

function requireString(value: string | undefined, name: string): string {
  if (!value || !value.trim()) {
    throw new Error(`${name} required`)
  }
  return value
}
