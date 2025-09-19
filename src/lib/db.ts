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
      throw new Error('Edge requires PRISMA_ACCELERATE_URL starting with prisma://')
    }

    edgeClient = new PrismaClient({
      datasourceUrl: accelUrl, // Edge must use prisma:// via Accelerate
    }).$extends(
      withAccelerate({
        url: accelUrl,
        apiKey: process.env.PRISMA_ACCELERATE_API_KEY, // optional if key is in URL
      })
    )

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
