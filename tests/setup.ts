import { afterEach, vi } from 'vitest'
import { getMockPrisma, setMockPrisma } from './utils/mockPrisma'

vi.mock('@/lib/dbSafe', () => ({
  tryPrisma: async (fn: (p: any) => any, fallback: any) => {
    const prisma = getMockPrisma()
    if (!prisma) return fallback
    return await fn(prisma)
  },
}))

vi.mock('@/lib/db', () => {
  const getProxy = () =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          const prisma = getMockPrisma()
          if (!prisma) throw new Error('Mock Prisma not set')
          const value = (prisma as any)[prop]
          if (typeof value === 'function') {
            return value.bind(prisma)
          }
          return value
        },
      },
    )
  const prismaProxy = getProxy()
  return {
    __esModule: true,
    default: prismaProxy,
    prisma: prismaProxy,
    getPrisma: async () => {
      const prisma = getMockPrisma()
      if (!prisma) throw new Error('Mock Prisma not set')
      return prisma
    },
  }
})

afterEach(() => {
  setMockPrisma(null)
})
