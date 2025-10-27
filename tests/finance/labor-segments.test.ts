import { describe, expect, it } from 'vitest'
import { deriveEventSegments, hoursForAssignment } from '@/lib/finance/labor'
import { zonedStartOfDayUtc } from '@/lib/timezone'

const eventBase = {
  id: 'evt-1',
  allDay: false,
  projectId: null,
  customerId: null,
  calendarId: 'cal-1',
} as const

describe('deriveEventSegments', () => {
  it('splits a timed event across local midnights', () => {
    const segments = deriveEventSegments({
      ...eventBase,
      startsAt: new Date('2025-03-02T03:00:00.000Z'),
      endsAt: new Date('2025-03-02T08:30:00.000Z'),
      allDay: false,
    })

    expect(segments).toHaveLength(2)
    expect(segments[0]!.hours).toBeCloseTo(2)
    expect(segments[1]!.hours).toBeCloseTo(3.5)
    expect(segments[0]!.dayKey).not.toEqual(segments[1]!.dayKey)
  })

  it('produces 8 hour chunks for multi-day all-day events', () => {
    const segments = deriveEventSegments({
      ...eventBase,
      startsAt: new Date('2025-03-05T05:00:00.000Z'),
      endsAt: new Date('2025-03-08T05:00:00.000Z'),
      allDay: true,
    })
    expect(segments).toHaveLength(3)
    expect(segments.map(s => s.hours)).toEqual([8, 8, 8])
  })

  it('handles all-day events without an end by adding one day', () => {
    const segments = deriveEventSegments({
      ...eventBase,
      startsAt: new Date('2025-04-01T05:00:00.000Z'),
      endsAt: new Date('2025-04-01T05:00:00.000Z'),
      allDay: true,
    })
    expect(segments).toHaveLength(1)
    expect(segments[0]!.hours).toBe(8)
  })
})

describe('hoursForAssignment', () => {
  it('returns override hours on matching dayOverride', () => {
    const segments = deriveEventSegments({
      ...eventBase,
      startsAt: new Date('2025-03-10T14:00:00.000Z'),
      endsAt: new Date('2025-03-10T20:00:00.000Z'),
      allDay: false,
    })

    const hours = hoursForAssignment(segments[0]!, {
      id: 'assign-1',
      eventId: 'evt-1',
      employeeId: 'emp-1',
      hours: 5,
      dayOverride: zonedStartOfDayUtc(segments[0]!.dayKey),
    })
    expect(hours).toBe(5)
  })

  it('only applies override once when no dayOverride', () => {
    const segments = deriveEventSegments({
      ...eventBase,
      startsAt: new Date('2025-03-15T23:30:00.000Z'),
      endsAt: new Date('2025-03-16T05:30:00.000Z'),
      allDay: false,
    })

    const first = hoursForAssignment(segments[0]!, {
      id: 'assign-1',
      eventId: 'evt-1',
      employeeId: 'emp-1',
      hours: 6,
      dayOverride: null,
    })

    const second = hoursForAssignment(segments[1]!, {
      id: 'assign-1',
      eventId: 'evt-1',
      employeeId: 'emp-1',
      hours: 6,
      dayOverride: null,
    })

    expect(first).toBe(6)
    expect(second).toBe(0)
  })
})
