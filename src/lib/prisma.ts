// Edge-safe Prisma client for Cloudflare Workers/Pages
import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"

// Support both Accelerate (prisma:// or prisma+postgres://) and direct Postgres URLs
const url = process.env.DATABASE_URL!
const base = new PrismaClient({ datasources: { db: { url } } })
// Cast to a single client type to avoid TS union-call issues when Accelerate is optional
export const prisma = ((url.startsWith("prisma://") || url.startsWith("prisma+"))
  ? base.$extends(withAccelerate())
  : base) as unknown as PrismaClient
