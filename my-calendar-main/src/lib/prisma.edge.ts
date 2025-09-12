import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"

const url = process.env.DATABASE_URL || ""
const hasApiKey = /[?&]api_key=/.test(url)
const wantsAccelerate = url.startsWith("prisma://") || (url.startsWith("prisma+postgres://") && hasApiKey)
const base = new PrismaClient({ datasources: { db: { url } } })
export const prisma = (wantsAccelerate ? base.$extends(withAccelerate()) : base) as unknown as PrismaClient

