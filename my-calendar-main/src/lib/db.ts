// src/lib/db.ts
// Server-only module. Do not import in client components.

import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

// DATABASE_URL must be a Prisma Accelerate/Data Proxy URL (starts with prisma://)
export const prisma = new PrismaClient({
  datasourceUrl: requireEnv('DATABASE_URL'),
}).$extends(withAccelerate())
