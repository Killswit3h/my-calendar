import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & { __plannerPrisma?: PrismaClient }

export const prisma =
  globalForPrisma.__plannerPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__plannerPrisma = prisma
}

export const getPrisma = async () => prisma

export default prisma
