import { describe, it, expect, beforeEach } from 'vitest'
import { MockPrisma, setMockPrisma } from './utils/mockPrisma'
import { getEventsForDay, __resetReportQueryCacheForTesting } from '@/server/reports/queries'
import { parseAppDateTime, parseAppDateOnly, APP_TZ, addDaysUtc } from '@/lib/timezone'
import { __setReportModeForTesting, __setDebugReportForTesting } from '@/lib/appConfig'

function localDateTime(value: string) {
  const parsed = parseAppDateTime(value, APP_TZ)
  if (!parsed) throw new Error(`Failed to parse ${value}`)
  return parsed
}

function localDate(value: string) {
  const parsed = parseAppDateOnly(value, APP_TZ)
  if (!parsed) throw new Error(`Failed to parse ${value}`)
  return parsed
}

describe('Daily report – INTERSECT mode', () => {
  beforeEach(() => {
    process.env.REPORT_MODE = 'INTERSECT'
    process.env.DEBUG_REPORT = '0'
    __setReportModeForTesting('INTERSECT')
    __setDebugReportForTesting(false)
    __resetReportQueryCacheForTesting()
  })

  it('includes overlapping events and excludes next-day bleed (naive storage)', async () => {
    const prisma = new MockPrisma()
    prisma.setEventTimestampType('naive')
    setMockPrisma(prisma)

    const target = '2025-10-06'

    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-06T09:00'), endsAt: localDateTime('2025-10-06T12:00'), title: 'Inside Day' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-05T22:00'), endsAt: localDateTime('2025-10-06T02:00'), title: 'Spans From Previous' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-06T23:00'), endsAt: localDateTime('2025-10-07T03:00'), title: 'Spans To Next' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-05T08:00'), endsAt: localDateTime('2025-10-05T10:00'), title: 'Previous Day Only' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-07T08:00'), endsAt: localDateTime('2025-10-07T10:00'), title: 'Next Day Only' })

    const allDay = localDate('2025-10-06')
    prisma.addEvent({ calendarId: 'cal', startsAt: allDay, endsAt: addDaysUtc(allDay, 1), title: 'All Day' })

    const nextAllDay = localDate('2025-10-07')
    prisma.addEvent({ calendarId: 'cal', startsAt: nextAllDay, endsAt: addDaysUtc(nextAllDay, 1), title: 'All Day Next Day' })

    const snapshot = await getEventsForDay(target)
    const titles = snapshot.rows.map(r => r.project)

    expect(titles).toEqual([
      'All Day',
      'Inside Day',
      'Spans From Previous',
      'Spans To Next',
    ])
    expect(titles).not.toContain('All Day Next Day')
  })

  it('handles DST spring-forward day in ET', async () => {
    const prisma = new MockPrisma()
    prisma.setEventTimestampType('naive')
    setMockPrisma(prisma)

    const target = '2024-03-10'

    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2024-03-09T23:30'), endsAt: localDateTime('2024-03-10T02:30'), title: 'Crosses Midnight Into DST' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2024-03-10T20:00'), endsAt: localDateTime('2024-03-11T01:00'), title: 'Evening After DST Jump' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2024-03-09T20:00'), endsAt: localDateTime('2024-03-09T22:00'), title: 'Previous Day Only (DST)' })

    const snapshot = await getEventsForDay(target)
    const titles = snapshot.rows.map(r => r.project)
    expect(titles).toEqual([
      'Crosses Midnight Into DST',
      'Evening After DST Jump',
    ])
  })

  it('handles DST fall-back day in ET', async () => {
    const prisma = new MockPrisma()
    prisma.setEventTimestampType('naive')
    setMockPrisma(prisma)

    const target = '2024-11-03'

    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2024-11-03T00:30'), endsAt: localDateTime('2024-11-03T03:30'), title: 'Spans Repeated Hour' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2024-11-02T22:00'), endsAt: localDateTime('2024-11-03T00:00'), title: 'Ends Exactly At Day Start' })

    const snapshot = await getEventsForDay(target)
    const titles = snapshot.rows.map(r => r.project)
    expect(titles).toEqual(['Spans Repeated Hour'])
  })

  it('produces the same results once storage is migrated to timestamptz', async () => {
    const prisma = new MockPrisma()
    prisma.setEventTimestampType('timestamptz')
    setMockPrisma(prisma)

    const target = '2025-10-06'

    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-06T07:00'), endsAt: localDateTime('2025-10-06T11:00'), title: 'Morning Work' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-05T23:30'), endsAt: localDateTime('2025-10-06T01:30'), title: 'Overnight Carry' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-06T22:00'), endsAt: localDateTime('2025-10-07T04:00'), title: 'Night Shift Handoff' })

    const snapshot = await getEventsForDay(target)
    const titles = snapshot.rows.map(r => r.project)
    expect(titles).toEqual([
      'Morning Work',
      'Night Shift Handoff',
      'Overnight Carry',
    ])
  })
})

describe('Daily report – CLAMP mode', () => {
  beforeEach(() => {
    process.env.REPORT_MODE = 'CLAMP'
    process.env.DEBUG_REPORT = '0'
    __setReportModeForTesting('CLAMP')
    __setDebugReportForTesting(false)
    __resetReportQueryCacheForTesting()
  })

  it('includes only events whose ET start date matches the report date', async () => {
    const prisma = new MockPrisma()
    prisma.setEventTimestampType('naive')
    setMockPrisma(prisma)

    const target = '2025-10-06'

    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-06T08:00'), endsAt: localDateTime('2025-10-06T12:00'), title: 'Inside Day' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-05T22:30'), endsAt: localDateTime('2025-10-06T02:30'), title: 'Prev Day Span' })
    prisma.addEvent({ calendarId: 'cal', startsAt: localDateTime('2025-10-06T22:00'), endsAt: localDateTime('2025-10-07T04:00'), title: 'Night Span' })

    const allDay = localDate('2025-10-06')
    prisma.addEvent({ calendarId: 'cal', startsAt: allDay, endsAt: addDaysUtc(allDay, 1), title: 'All Day' })

    const nextAllDay = localDate('2025-10-07')
    prisma.addEvent({ calendarId: 'cal', startsAt: nextAllDay, endsAt: addDaysUtc(nextAllDay, 1), title: 'All Day Next Day' })

    const snapshot = await getEventsForDay(target)
    const titles = snapshot.rows.map(r => r.project)

    expect(titles).toEqual([
      'All Day',
      'Inside Day',
      'Night Span',
    ])
    expect(titles).not.toContain('All Day Next Day')
    expect(titles).not.toContain('Prev Day Span')
  })
})
