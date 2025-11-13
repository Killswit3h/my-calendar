import { describe, it, expect, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

import { nextChangeOrderNumber, nextEstimateNumber } from '../lib/docNumbers'

const prisma = new PrismaClient()

describe('docNumbers', () => {
  it('generates sequential estimate numbers per year', async () => {
    const year = 2026
    const first = await nextEstimateNumber(year)
    const second = await nextEstimateNumber(year)
    expect(first).not.toEqual(second)
    expect(first.startsWith(`EST-${year}-`)).toBe(true)
    expect(second.startsWith(`EST-${year}-`)).toBe(true)
  })

  it('generates sequential change order numbers per year', async () => {
    const year = 2026
    const first = await nextChangeOrderNumber(year)
    const second = await nextChangeOrderNumber(year)
    expect(first).not.toEqual(second)
    expect(first.startsWith(`CO-${year}-`)).toBe(true)
    expect(second.startsWith(`CO-${year}-`)).toBe(true)
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
