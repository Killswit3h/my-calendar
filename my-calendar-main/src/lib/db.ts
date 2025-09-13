// src/lib/db.ts
// Server-only module. Do not import in client components.

import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const url = process.env.DATABASE_URL

export const prisma = url
  ? (new PrismaClient({ datasourceUrl: url }).$extends(withAccelerate()) as any)
  : ({} as any)
