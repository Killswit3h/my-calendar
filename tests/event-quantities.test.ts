import { beforeEach, describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'
import { PUT } from '@/app/api/events/[id]/quantities/route'
import { MockPrisma, setMockPrisma } from './utils/mockPrisma'

describe('Event quantities API', () => {
  let prisma: MockPrisma
  let eventId: string
  let itemGuardrail: { id: string }
  let itemSign: { id: string }

  beforeEach(async () => {
    prisma = new MockPrisma()
    setMockPrisma(prisma)

    const event = prisma.addEvent({ calendarId: 'cal-1', startsAt: new Date('2025-01-15T12:00:00Z'), title: 'Guardrail Install' })
    eventId = event.id
    itemGuardrail = prisma.addPayItem({ number: '620-00001', description: 'Guardrail', unit: 'LF' })
    itemSign = prisma.addPayItem({ number: '700-00001', description: 'Sign', unit: 'EA' })

    await prisma.eventQuantity.create({
      data: {
        eventId,
        payItemId: itemGuardrail.id,
        quantity: new Prisma.Decimal('10'),
        notes: 'Old quantity',
      },
    })
  })

  it('replaces existing quantities with the provided set', async () => {
    const request: any = {
      json: async () => ({
        lines: [
          {
            payItemId: itemSign.id,
            quantity: '5.25',
            stationFrom: '10+00',
            stationTo: '12+00',
            notes: 'Install sign',
          },
        ],
      }),
    }

    const params = Promise.resolve({ id: eventId })
    const res = await PUT(request, { params })
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.count).toBe(1)
    expect(body.total).toBe('5.25')
    expect(body.hasQuantities).toBe(true)
    expect(body.items).toHaveLength(1)
    expect(body.items[0].payItem?.number).toBe('700-00001')
    expect(body.items[0].stationFrom).toBe('10+00')

    expect(prisma.eventQuantities.size).toBe(1)
    const stored = Array.from(prisma.eventQuantities.values())[0]
    expect(stored.payItemId).toBe(itemSign.id)
    expect(stored.quantity.toString()).toBe('5.25')
    expect(stored.notes).toBe('Install sign')
  })

  it('returns validation error when payload is invalid', async () => {
    const request: any = {
      json: async () => ({ lines: [{ payItemId: '', quantity: -1 }] }),
    }

    const res = await PUT(request, { params: Promise.resolve({ id: eventId }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('validation failed')
    expect(Array.isArray(body.details)).toBe(true)
  })
})
