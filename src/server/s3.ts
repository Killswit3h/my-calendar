import { S3Client } from "@aws-sdk/client-s3"

function getEnv(name: string): string | undefined {
  const v = process.env[name]
  return (v && v.trim().length > 0) ? v : undefined
}

const REGION = getEnv("BACKUP_S3_REGION") ?? "us-east-1"
const ENDPOINT = getEnv("BACKUP_S3_ENDPOINT")
const ACCESS_KEY_ID = getEnv("BACKUP_S3_ACCESS_KEY_ID")
const SECRET_ACCESS_KEY = getEnv("BACKUP_S3_SECRET_ACCESS_KEY")

// Create S3 client configured for AWS, R2 or MinIO
export const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: !!ENDPOINT,
  credentials: (ACCESS_KEY_ID && SECRET_ACCESS_KEY)
    ? { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY }
    : undefined,
})

export default s3

