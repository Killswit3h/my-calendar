import { afterEach, vi } from 'vitest'
import { getMockPrisma, setMockPrisma } from './utils/mockPrisma'

vi.mock('@/lib/dbSafe', () => ({
  tryPrisma: async (fn: (p: any) => any, fallback: any) => {
    const prisma = getMockPrisma()
    if (!prisma) return fallback
    return await fn(prisma)
  },
}))

afterEach(() => {
  setMockPrisma(null)
})
