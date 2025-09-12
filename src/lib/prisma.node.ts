import { PrismaClient } from "@prisma/client"

const rawUrl = process.env.DATABASE_URL || ""
// Normalize accidental prisma+postgres:// for Node client
const url = rawUrl.replace(/^prisma\+postgres:\/\//, "postgresql://")

const g = globalThis as any
export const prisma: PrismaClient = g.__prisma ?? new PrismaClient({ datasources: { db: { url } } })
if (process.env.NODE_ENV !== "production") g.__prisma = prisma

