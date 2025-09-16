// src/lib/dbSafe.ts
import { getPrisma } from './db'

export async function tryPrisma<T>(thunk: (p: any) => Promise<T>, fallback: T): Promise<T> {
  try {
    const p = await getPrisma()
    return await thunk(p)
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    if (msg.includes("Can't reach database server") || e?.code === 'P1001') return fallback
    throw e
  }
}
