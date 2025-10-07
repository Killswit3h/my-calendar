// Date utilities for week computation and event/day overlap
// - Computes local week dates respecting weekStartsOn
// - Checks overlap of an event [start,end) with a local day range [00:00, 24:00)

export type MinimalEvent = {
  start: string | Date
  end: string | Date
  allDay?: boolean | null
}

// Returns new Date at local midnight for the provided date
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

// Add days (local)
export function addDaysLocal(d: Date, days: number): Date {
  const copy = new Date(d.getTime())
  copy.setDate(copy.getDate() + days)
  return copy
}

// Format as ISO YYYY-MM-DD using local date parts
export function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Week dates for anyDateInView; weekStartsOn: 0 (Sun) | 1 (Mon)
export function weekDates(anyDateInView: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const base = startOfLocalDay(anyDateInView)
  const dow = base.getDay() // 0..6 (Sun..Sat)
  const offset = weekStartsOn === 1 ? ((dow + 6) % 7) : dow // days since week start
  const start = addDaysLocal(base, -offset)
  const days: Date[] = []
  for (let i = 0; i < 7; i++) days.push(addDaysLocal(start, i))
  return days
}

// Return [startInclusive, endExclusive) bounds for a local day
export function dayBoundsLocal(day: Date): { start: Date; end: Date } {
  const start = startOfLocalDay(day)
  const end = addDaysLocal(start, 1)
  return { start, end }
}

// Parse event timestamps into Dates. For allDay date-only strings (YYYY-MM-DD),
// treat them as local midnight, with end as exclusive next day when same.
function parseEventRange(e: MinimalEvent): { start: Date; end: Date } {
  const isAllDay = !!e.allDay
  const toDate = (v: string | Date): Date => (v instanceof Date ? new Date(v.getTime()) : new Date(v))
  let s = toDate(e.start)
  let t = toDate(e.end)
  // Detect date-only strings (length === 10) and coerce to local midnight
  const isDateOnly = (v: string | Date) => typeof v === 'string' && v.length === 10 && /\d{4}-\d{2}-\d{2}/.test(v)
  if (isAllDay || isDateOnly(e.start) || isDateOnly(e.end)) {
    const sLocal = typeof e.start === 'string' ? new Date(e.start + 'T00:00:00') : s
    const eLocal = typeof e.end === 'string' ? new Date(e.end + 'T00:00:00') : t
    s = new Date(sLocal.getFullYear(), sLocal.getMonth(), sLocal.getDate())
    t = new Date(eLocal.getFullYear(), eLocal.getMonth(), eLocal.getDate())
    // Ensure exclusive end is after start
    if (t.getTime() <= s.getTime()) t = addDaysLocal(s, 1)
  }
  return { start: s, end: t }
}

// Overlap test: event [start,end) overlaps local day [00:00,24:00)
export function eventOverlapsLocalDay(e: MinimalEvent, day: Date): boolean {
  const { start, end } = parseEventRange(e)
  const { start: ds, end: de } = dayBoundsLocal(day)
  return start < de && end > ds
}

