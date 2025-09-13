// src/lib/db.ts
// Server-only module. Do not import in client components.

import { withAccelerate } from '@prisma/extension-accelerate'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

const url = requireEnv('DATABASE_URL')

const prisma = url.startsWith('prisma://')
  ? new (await import('@prisma/client/edge')).PrismaClient({ datasourceUrl: url }).$extends(withAccelerate())
  : new (await import('@prisma/client')).PrismaClient({ datasources: { db: { url } } })

export { prisma }
