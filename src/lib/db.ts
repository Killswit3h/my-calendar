// src/lib/db.ts
// Server-only module. Do not import in client components.

import { withAccelerate } from '@prisma/extension-accelerate'
import { createRequire } from 'module'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

const require = createRequire(import.meta.url)

const url = requireEnv('DATABASE_URL')

let prisma: any
if (url.startsWith('prisma://')) {
  const { PrismaClient } = require('@prisma/client/edge')
  prisma = new PrismaClient({ datasourceUrl: url }).$extends(withAccelerate())
} else {
  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient({ datasources: { db: { url } } })
}

export { prisma }
