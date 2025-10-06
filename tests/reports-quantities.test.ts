import { beforeEach, describe, expect, it } from 'vitest'
import { GET } from '@/app/api/reports/quantities/route'
import { MockPrisma, setMockPrisma } from './utils/mockPrisma'

describe('Reports quantities endpoint', () => {
  let prisma: MockPrisma

beforeEach(async () => {
  prisma = new MockPrisma()
  setMockPrisma(prisma)

    const inside = prisma.addEvent({
      id: 'evt-in',
      calendarId: 'cal-a',
      startsAt: new Date('2025-02-10T12:00:00Z'),
      title: 'Inside Range Job',
    })

    const outside = prisma.addEvent({
      id: 'evt-out',
      calendarId: 'cal-a',
      startsAt: new Date('2025-03-01T12:00:00Z'),
      title: 'Outside Range',
    })

    const payItem = prisma.addPayItem({ number: '620-00001', description: 'Guardrail', unit: 'LF' })

    await prisma.eventQuantity.create({
      data: { eventId: inside.id, payItemId: payItem.id, quantity: '12.5', notes: 'Inside window' },
    })
    await prisma.eventQuantity.create({
      data: { eventId: outside.id, payItemId: payItem.id, quantity: '4', notes: 'Outside window' },
    })
})

  it('returns only rows within the inclusive date range and matching customer text', async () => {
    const url = new URL('http://localhost/api/reports/quantities?from=2025-02-01&to=2025-02-28&customer=inside')
    const req: any = { nextUrl: url }

    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.count).toBe(1)
    expect(body.rows).toHaveLength(1)
    expect(body.rows[0].eventId).toBe('evt-in')
    expect(body.rows[0].quantity).toBe('12.5')
    expect(body.rows[0].payItemNumber).toBe('620-00001')
    expect(body.rows[0].eventTitle).toBe('Inside Range Job')
  })

  it('rejects missing date params', async () => {
    const req: any = { nextUrl: new URL('http://localhost/api/reports/quantities') }
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
