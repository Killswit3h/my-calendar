// Edge-safe Prisma client for Cloudflare Workers/Pages
import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"

// Support both Accelerate (prisma:// or prisma+postgres:// WITH api_key) and plain Postgres URLs
const rawUrl = process.env.DATABASE_URL!
const hasApiKey = /[?&]api_key=/.test(rawUrl)
const wantsAccelerate = rawUrl.startsWith("prisma://") || (rawUrl.startsWith("prisma+postgres://") && hasApiKey)
// If not using Accelerate, normalize prisma+postgres:// back to postgresql:// so the base client is happy
const url = wantsAccelerate ? rawUrl : rawUrl.replace(/^prisma\+postgres:\/\//, "postgresql://")
const base = new PrismaClient({ datasources: { db: { url } } })
// Cast to a single client type to avoid TS union-call issues when Accelerate is optional
export const prisma = (wantsAccelerate ? base.$extends(withAccelerate()) : base) as unknown as PrismaClient
