// src/lib/dbSafe.ts
import { prisma as nodePrisma } from './db'

export const prisma = nodePrisma

export async function tryPrisma<T>(thunk: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await thunk()
  } catch (e: any) {
    const code = e?.code
    const msg = String(e?.message ?? '')
    const transient = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'].includes(code)
    const network = msg.includes("Can't reach database server")
    if (transient || network) return fallback
    throw e
  }
}
