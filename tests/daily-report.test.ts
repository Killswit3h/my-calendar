import { describe, it, expect, beforeEach } from 'vitest'
import { MockPrisma, setMockPrisma } from './utils/mockPrisma'
import { getEventsForDay } from '@/server/reports/queries'
import { parseAppDateTime, parseAppDateOnly, APP_TIMEZONE, addDaysUtc } from '@/lib/timezone'

function localDateTime(value: string) {
  const parsed = parseAppDateTime(value, APP_TIMEZONE)
  if (!parsed) throw new Error(`Failed to parse ${value}`)
  return parsed
}

function localDate(value: string) {
  const parsed = parseAppDateOnly(value, APP_TIMEZONE)
  if (!parsed) throw new Error(`Failed to parse ${value}`)
  return parsed
}

describe('getEventsForDay', () => {
  beforeEach(() => {
    process.env.REPORT_TIMEZONE = 'America/New_York'
    process.env.DEBUG_DAILY_REPORT = '0'
  })

  it('returns only events overlapping the requested day', async () => {
    const prisma = new MockPrisma()
    setMockPrisma(prisma)

    const target = '2025-10-06'

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2025-10-06T09:00'),
      endsAt: localDateTime('2025-10-06T12:00'),
      title: 'Inside Day',
    })

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2025-10-05T22:00'),
      endsAt: localDateTime('2025-10-06T02:00'),
      title: 'Spans From Previous',
    })

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2025-10-06T23:00'),
      endsAt: localDateTime('2025-10-07T03:00'),
      title: 'Spans To Next',
    })

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2025-10-05T08:00'),
      endsAt: localDateTime('2025-10-05T10:00'),
      title: 'Previous Day Only',
    })

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2025-10-07T08:00'),
      endsAt: localDateTime('2025-10-07T10:00'),
      title: 'Next Day Only',
    })

    const allDay = localDate('2025-10-06')
    prisma.addEvent({
      calendarId: 'cal',
      startsAt: allDay,
      endsAt: addDaysUtc(allDay, 1),
      title: 'All Day',
    })

    const prevAllDay = localDate('2025-10-05')
    prisma.addEvent({
      calendarId: 'cal',
      startsAt: prevAllDay,
      endsAt: addDaysUtc(prevAllDay, 1),
      title: 'All Day Previous Only',
    })

    const nextAllDay = localDate('2025-10-07')
    prisma.addEvent({
      calendarId: 'cal',
      startsAt: nextAllDay,
      endsAt: addDaysUtc(nextAllDay, 1),
      title: 'All Day Next Day',
    })

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

  it('handles DST spring-forward day correctly', async () => {
    const prisma = new MockPrisma()
    setMockPrisma(prisma)

    const target = '2024-03-10' // US spring forward

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2024-03-09T23:30'),
      endsAt: localDateTime('2024-03-10T02:30'),
      title: 'Crosses Midnight Into DST',
    })

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2024-03-10T20:00'),
      endsAt: localDateTime('2024-03-11T01:00'),
      title: 'Evening After DST Jump',
    })

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2024-03-09T20:00'),
      endsAt: localDateTime('2024-03-09T22:00'),
      title: 'Previous Day Only (DST)',
    })

    const snapshot = await getEventsForDay(target)
    const titles = snapshot.rows.map(r => r.project)
    expect(titles).toEqual([
      'Crosses Midnight Into DST',
      'Evening After DST Jump',
    ])
  })

  it('handles DST fall-back day correctly', async () => {
    const prisma = new MockPrisma()
    setMockPrisma(prisma)

    const target = '2024-11-03' // US fall back

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2024-11-03T00:30'),
      endsAt: localDateTime('2024-11-03T03:30'),
      title: 'Spans Repeated Hour',
    })

    prisma.addEvent({
      calendarId: 'cal',
      startsAt: localDateTime('2024-11-02T22:00'),
      endsAt: localDateTime('2024-11-03T00:00'),
      title: 'Ends Exactly At Day Start',
    })

    const snapshot = await getEventsForDay(target)
    const titles = snapshot.rows.map(r => r.project)
    expect(titles).toEqual([
      'Spans Repeated Hour',
    ])
  })
})
