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

    const accelUrl = process.env.PRISMA_ACCELERATE_URL
    if (!accelUrl || !accelUrl.startsWith('prisma://')) {
      throw new Error('PRISMA_ACCELERATE_URL must start with prisma://')
    }

    edgeClient = new PrismaClient({
      datasourceUrl: accelUrl, // use Accelerate endpoint
    }).$extends(withAccelerate())

    return edgeClient
  }

  if (nodeClient) return nodeClient
  const { PrismaClient } = await import('@prisma/client')

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('Missing DATABASE_URL for Node runtime')

  const g = globalThis as any
  nodeClient =
    g.prisma ??
    new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })

  if (process.env.NODE_ENV !== 'production') g.prisma = nodeClient
  return nodeClient
}
