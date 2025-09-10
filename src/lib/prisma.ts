// Edge-safe Prisma client for Cloudflare Workers/Pages
import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"

// Support both Accelerate (prisma:// or prisma+postgres:// WITH api_key) and plain prisma+postgres URLs
const url = process.env.DATABASE_URL!
const base = new PrismaClient({ datasources: { db: { url } } })
const hasApiKey = /[?&]api_key=/.test(url)
const wantsAccelerate = url.startsWith("prisma://") || (url.startsWith("prisma+postgres://") && hasApiKey)
// Cast to a single client type to avoid TS union-call issues when Accelerate is optional
export const prisma = (wantsAccelerate ? base.$extends(withAccelerate()) : base) as unknown as PrismaClient
