import { PutObjectCommand } from "@aws-sdk/client-s3"
import s3 from "@/server/s3"

function nowIsoNoColons(): string {
  return new Date().toISOString().replace(/:/g, "-")
}

function getRequiredEnv(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) throw new Error(`Missing env ${name}`)
  return v
}

export async function uploadJson(key: string, payload: unknown): Promise<void> {
  const bucket = getRequiredEnv("BACKUP_S3_BUCKET")
  const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8")
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/json",
    CacheControl: "no-store",
  })
  const res = await s3.send(cmd)
  const status = res.$metadata.httpStatusCode ?? 0
  if (status < 200 || status >= 300) {
    throw new Error(`S3 put failed (${status}) for key ${key}`)
  }
}

export function buildEventBackupKey(eventId: string, action: "create" | "update" | "delete" | "upsert"): string {
  const d = new Date()
  const yyyy = d.getUTCFullYear().toString()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `events/${yyyy}/${mm}/${dd}/${eventId}-${action}-${nowIsoNoColons()}.json`
}

export function buildFullExportKey(): string {
  return `full-exports/events-${nowIsoNoColons()}.json`
}

