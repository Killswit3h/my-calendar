// src/lib/db.ts
import { withAccelerate } from '@prisma/extension-accelerate'

let nodeClient: any
let edgeClient: any

const isEdge = () =>
  typeof (globalThis as any).EdgeRuntime !== 'undefined' ||
  process.env.NEXT_RUNTIME === 'edge' ||
  process.env.CF_PAGES === '1' ||
  process.env.CF_WORKER === '1'

export const getPrisma = async () => {
  if (isEdge()) {
    if (edgeClient) return edgeClient
    const { PrismaClient } = await import('@prisma/client/edge')
    if (!process.env.DATABASE_URL || !process.env.PRISMA_ACCELERATE_URL)
      throw new Error('Missing DATABASE_URL or PRISMA_ACCELERATE_URL')
    edgeClient = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL }).$extends(withAccelerate())
    return edgeClient
  }
  if (nodeClient) return nodeClient
  const { PrismaClient } = await import('@prisma/client')
  const g = globalThis as any
  nodeClient = g.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn','error'] : ['error'] })
  if (process.env.NODE_ENV !== 'production') g.prisma = nodeClient
  return nodeClient
}
