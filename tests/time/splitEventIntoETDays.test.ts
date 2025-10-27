import { describe, expect, it } from 'vitest'

const loadModule = async () => await import('@/lib/time/splitEventIntoETDays')

describe('splitEventIntoETDays', () => {
  it('handles single-day event within ET', async () => {
    const { splitEventIntoETDays } = await loadModule()
    const start = new Date('2024-10-01T08:00:00Z')
    const end = new Date('2024-10-01T16:00:00Z')
    const segments = splitEventIntoETDays(start, end)
    expect(segments).toHaveLength(1)
    expect(segments[0]?.day).toBe('2024-10-01')
    expect(segments[0]?.hours).toBeCloseTo(8)
  })

  it('splits an overnight event across midnight', async () => {
    const { splitEventIntoETDays } = await loadModule()
    const start = new Date('2024-10-05T22:00:00Z')
    const end = new Date('2024-10-06T06:00:00Z')
    const segments = splitEventIntoETDays(start, end)
    expect(segments).toHaveLength(2)
    expect(segments[0]?.day).toBe('2024-10-05')
    expect(segments[0]?.hours).toBeCloseTo(6) // 18:00 to midnight local
    expect(segments[1]?.day).toBe('2024-10-06')
    expect(segments[1]?.hours).toBeCloseTo(2) // 00:00-02:00 ET
    const total = segments.reduce((acc, seg) => acc + seg.hours, 0)
    expect(total).toBeCloseTo((end.getTime() - start.getTime()) / 3_600_000)
  })

  it('handles multi-day events spanning DST fallback', async () => {
    const { splitEventIntoETDays } = await loadModule()
    const start = new Date('2024-11-02T22:00:00Z')
    const end = new Date('2024-11-04T12:00:00Z')
    const segments = splitEventIntoETDays(start, end)
    expect(segments).toHaveLength(3)
    const hoursByDay = Object.fromEntries(segments.map(seg => [seg.day, seg.hours]))
    expect(hoursByDay['2024-11-02']).toBeCloseTo(6)
    expect(hoursByDay['2024-11-03']).toBeCloseTo(25) // DST fallback adds an extra hour
    expect(hoursByDay['2024-11-04']).toBeCloseTo(7)
    const total = segments.reduce((acc, seg) => acc + seg.hours, 0)
    expect(total).toBeCloseTo((end.getTime() - start.getTime()) / 3_600_000)
  })

  it('omits zero-length trailing day when ending at midnight', async () => {
    const { splitEventIntoETDays } = await loadModule()
    const start = new Date('2024-10-03T12:00:00Z')
    const end = new Date('2024-10-04T00:00:00Z')
    const segments = splitEventIntoETDays(start, end)
    expect(segments).toHaveLength(1)
    expect(segments[0]?.day).toBe('2024-10-03')
    expect(segments[0]?.hours).toBeCloseTo(12)
  })
})
