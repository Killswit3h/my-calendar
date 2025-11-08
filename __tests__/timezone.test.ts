import { describe, expect, it } from 'vitest'
import { anchorAllDayAtNineLocal, computeReminderTimes, localISOToUTC } from '@/lib/timezone'

describe('timezone utilities', () => {
  it('converts local ISO to UTC preserving instant', () => {
    const utc = localISOToUTC('2025-11-05T09:30')
    expect(utc).toMatch(/2025-11-05T1[34]:30:00\.000Z/)
  })

  it('anchors all-day reminders at 09:00 local time in UTC output', () => {
    const anchor = anchorAllDayAtNineLocal('2025-11-05')
    expect(anchor).toMatch(/T14:00:00\.000Z$/)
  })

  it('computes reminder times using offsets', () => {
    const times = computeReminderTimes({
      allDay: false,
      startAtUTC: '2025-11-05T14:00:00.000Z',
      offsetsMinutes: [10, 60],
    })
    expect(times).toHaveLength(2)
    expect(times[0]).toMatch(/T13:50:00\.000Z$/)
  })
})
