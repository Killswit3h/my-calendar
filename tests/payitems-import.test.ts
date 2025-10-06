import { describe, expect, it, beforeEach } from 'vitest'
import { POST } from '@/app/api/payitems/import/route'
import { MockPrisma, setMockPrisma } from './utils/mockPrisma'

describe('Pay item import API', () => {
  let prisma: MockPrisma

  beforeEach(() => {
    prisma = new MockPrisma()
    setMockPrisma(prisma)
  })

  it('creates new items and updates existing numbers case-insensitively', async () => {
    prisma.addPayItem({ id: 'pi-existing', number: '620-00001', description: 'Old Guardrail', unit: 'lf' })

    const request: any = {
      json: async () => ({
        rows: [
          { number: '620-00001', description: 'Guardrail, Steel', unit: 'LF' },
          { number: '700-00001', description: 'Sign, Single Post', unit: 'ea' },
          { number: '', description: 'Missing number', unit: 'EA' },
        ],
      }),
    }

    const res = await POST(request)
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.imported).toBe(1)
    expect(body.updated).toBe(1)
    expect(body.rejected).toHaveLength(1)
    expect(prisma.payItems.size).toBe(2)

    const updated = Array.from(prisma.payItems.values()).find(item => item.number === '620-00001')
    expect(updated).toBeTruthy()
    expect(updated?.description).toBe('Guardrail, Steel')
    expect(updated?.unit).toBe('LF')

    const created = Array.from(prisma.payItems.values()).find(item => item.number === '700-00001')
    expect(created).toBeTruthy()
    expect(created?.unit).toBe('EA')
  })
})
