// src/server/prisma.ts
import { getPrisma } from "@/lib/db"
import { uploadJson, buildEventBackupKey } from "@/server/backup"

// Wrap only Event mutations with lightweight backup hooks.
// Everything else passes through to the base client.
function withEventBackup(p: any) {
  return {
    ...p,
    event: {
      ...p.event,
      async create(args: any) {
        const res = await p.event.create(args)
        try { await uploadJson(buildEventBackupKey(res.id, "create"), { after: res }) } catch {}
        return res
      },
      async update(args: any) {
        const res = await p.event.update(args)
        try { await uploadJson(buildEventBackupKey(res.id, "update"), { after: res }) } catch {}
        return res
      },
      async upsert(args: any) {
        const res = await p.event.upsert(args)
        try { await uploadJson(buildEventBackupKey(res.id, "upsert"), { after: res }) } catch {}
        return res
      },
      async delete(args: any) {
        const res = await p.event.delete(args)
        try { await uploadJson(buildEventBackupKey(res.id, "delete"), { before: res }) } catch {}
        return res
      },
    },
  }
}

// Call this where you need the client with backup hooks.
export async function getPrismaWithBackup() {
  const base = await getPrisma()
  return withEventBackup(base)
}
