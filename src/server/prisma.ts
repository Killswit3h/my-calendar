import { prisma as base } from "@/lib/db"
import { uploadJson, buildEventBackupKey } from "@/server/backup"

function withEventBackup() {
  return base.$extends({
    query: {
      event: {
        async create({ args, query }: any) {
          const result = await query(args)
          try {
            const id = (result as any)?.id as string | undefined
            if (id) {
              const key = buildEventBackupKey(id, "create")
              await uploadJson(key, { ...result, op: "create" })
            }
          } catch (e) {
            console.error("Event backup failed (create)", e)
          }
          return result
        },
        async update({ args, query }: any) {
          const result = await query(args)
          try {
            const id = (result as any)?.id as string | undefined
            if (id) {
              const key = buildEventBackupKey(id, "update")
              await uploadJson(key, { ...result, op: "update" })
            }
          } catch (e) {
            console.error("Event backup failed (update)", e)
          }
          return result
        },
        async upsert({ args, query }: any) {
          const result = await query(args)
          try {
            const id = (result as any)?.id as string | undefined
            if (id) {
              const key = buildEventBackupKey(id, "upsert")
              await uploadJson(key, { ...result, op: "upsert" })
            }
          } catch (e) {
            console.error("Event backup failed (upsert)", e)
          }
          return result
        },
        async delete({ args, query }: any) {
          const result = await query(args)
          try {
            const id = (result as any)?.id as string | undefined
            if (id) {
              const key = buildEventBackupKey(id, "delete")
              await uploadJson(key, { ...result, op: "delete" })
            }
          } catch (e) {
            console.error("Event backup failed (delete)", e)
          }
          return result
        },
      },
    },
  })
}

type PrismaWithBackup = ReturnType<typeof withEventBackup>
// Prisma 6 removed $use middleware. Use query extensions instead.
// Ensure the extension is only applied once during dev HMR.
const g = globalThis as unknown as { __prisma_with_backup__?: PrismaWithBackup }

export const prisma = g.__prisma_with_backup__ ?? withEventBackup()
if (process.env.NODE_ENV !== "production") g.__prisma_with_backup__ = prisma

export default prisma
