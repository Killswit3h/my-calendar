// src/lib/dbSafe.ts
import { getPrisma } from './db'

const DB_UNAVAILABLE_MESSAGES = [
  "Can't reach database server",
  'Environment variable not found: DATABASE_URL',
  'Missing DATABASE_URL',
]

function isDatabaseUnavailable(error: any): boolean {
  const msg = String(error?.message ?? '')
  if (!msg && error?.code === 'P1001') return true
  if (error?.code === 'P1001') return true
  return DB_UNAVAILABLE_MESSAGES.some(fragment => (fragment ? msg.includes(fragment) : false))
}

export async function tryPrisma<T>(thunk: (p: any) => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL || !String(process.env.DATABASE_URL).trim()) {
    return fallback
  }

  try {
    const p = await getPrisma()
    return await thunk(p)
  } catch (e: any) {
    if (isDatabaseUnavailable(e)) return fallback
    throw e
  }
}
