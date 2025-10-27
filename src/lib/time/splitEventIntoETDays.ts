import { formatInTimeZone, zonedStartOfDayUtc, addDaysUtc, APP_TIMEZONE } from '@/lib/timezone'

const MS_IN_HOUR = 3600000

export type EventDaySegment = {
  day: string
  startUtc: Date
  endUtc: Date
  hours: number
}

function clampToRange(value: number, min: number, max: number) {
  if (value < min) return min
  if (value > max) return max
  return value
}

export function splitEventIntoETDays(startsAt: Date, endsAt: Date): EventDaySegment[] {
  const startMs = startsAt.getTime()
  const endMs = endsAt.getTime()

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return []
  }

  const segments: EventDaySegment[] = []
  let cursor = new Date(startMs)

  while (cursor.getTime() < endMs) {
    const { date: day } = formatInTimeZone(cursor, APP_TIMEZONE)
    const dayStartUtc = zonedStartOfDayUtc(day, APP_TIMEZONE)
    const nextDayStartUtc = addDaysUtc(dayStartUtc, 1)

    const segmentStartMs = clampToRange(cursor.getTime(), dayStartUtc.getTime(), endMs)
    const segmentEndMs = clampToRange(endMs, segmentStartMs, nextDayStartUtc.getTime())

    const spanMs = segmentEndMs - segmentStartMs
    if (spanMs <= 0) {
      cursor = new Date(nextDayStartUtc.getTime())
      continue
    }

    const hours = spanMs / MS_IN_HOUR
    segments.push({
      day,
      startUtc: new Date(segmentStartMs),
      endUtc: new Date(segmentEndMs),
      hours,
    })

    cursor = new Date(segmentEndMs)
  }

  return segments
}
