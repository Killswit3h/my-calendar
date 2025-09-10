// Edge-safe Prisma client for Cloudflare Workers/Pages
import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"

// Use pooled DATABASE_URL (Neon pooler or Prisma Accelerate)
export const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL! } },
}).$extends(withAccelerate())
