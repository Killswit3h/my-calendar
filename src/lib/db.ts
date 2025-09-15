// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Copy .env.example to .env and set it.')
}

const g = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  g.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') g.prisma = prisma
