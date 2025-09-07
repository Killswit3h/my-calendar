import { prisma as base } from "@/lib/prisma"
import { uploadJson, buildEventBackupKey } from "@/server/backup"

// Ensure middleware is only registered once during dev HMR
const g = globalThis as unknown as { __prisma_backup_mw__?: boolean }

if (!g.__prisma_backup_mw__) {
  g.__prisma_backup_mw__ = true
  base.$use(async (params, next) => {
    const isEvent = params.model === "Event"
    const isWrite = params.action === "create" || params.action === "update" || params.action === "upsert" || params.action === "delete"
    const action = params.action as "create" | "update" | "upsert" | "delete" | string
    const result = await next(params)
    if (isEvent && isWrite && result) {
      try {
        const id: string | undefined = result.id as string | undefined
        if (id) {
          const key = buildEventBackupKey(id, action as any)
          await uploadJson(key, { ...result, op: action })
        }
      } catch (e) {
        console.error("Event backup failed (middleware)", e)
      }
    }
    return result
  })
}

export const prisma = base
export default prisma

