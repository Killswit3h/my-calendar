import { prisma } from "@/lib/db"

function isDbUnavailableError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || "")).toLowerCase()
  return (
    msg.includes("can't reach database server") ||
    msg.includes("environment variable not found: database_url") ||
    msg.includes("error validating datasource") ||
    msg.includes("p1001")
  )
}

let lastCheck = 0
let cachedAvailable: boolean | null = null
const CHECK_TTL_MS = 60000

async function checkDbAvailable(): Promise<boolean> {
  const now = Date.now()
  if (cachedAvailable !== null && now - lastCheck < CHECK_TTL_MS) return cachedAvailable
  try {
    // Lightweight connectivity probe
    await prisma.$queryRaw`SELECT 1`
    cachedAvailable = true
  } catch (e) {
    if (isDbUnavailableError(e)) {
      cachedAvailable = false
    } else {
      // Unknown error: consider DB reachable and let callers handle
      cachedAvailable = true
    }
  } finally {
    lastCheck = now
  }
  return cachedAvailable
}

export async function tryPrisma<T>(task: PromiseLike<T> | (() => PromiseLike<T>), fallback: T): Promise<T> {
  // If a thunk is provided, we can avoid touching the DB when unavailable
  const thunk = typeof task === 'function' ? (task as () => PromiseLike<T>) : null
  if (thunk) {
    const ok = await checkDbAvailable()
    if (!ok) return fallback
    try {
      const res = await thunk()
      return res
    } catch (e) {
      if (isDbUnavailableError(e)) {
        cachedAvailable = false
        lastCheck = Date.now()
        return fallback
      }
      throw e
    }
  }

  // Back-compat: if a Promise was passed directly
  try {
    return await (task as PromiseLike<T>)
  } catch (e) {
    if (isDbUnavailableError(e)) return fallback
    throw e
  }
}

export { prisma }
