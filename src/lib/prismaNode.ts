// Node.js Prisma client for API routes that cannot run on Edge
import { PrismaClient } from "@prisma/client";

let rawUrl = process.env.DATABASE_URL || "";
if (!rawUrl) {
  throw new Error("DATABASE_URL is not set. Please set it in .env");
}
// Remove UTF-8 BOM if present, surrounding quotes, and trim whitespace
rawUrl = rawUrl.replace(/^\uFEFF/, "").trim().replace(/^['\"]/ , "").replace(/['\"]$/, "");
// Normalize prisma+postgres:// to postgresql:// if ever used
const url = rawUrl.replace(/^prisma\+postgres:\/\//, "postgresql://");
if (!/^([a-zA-Z]+):\/\//.test(url)) {
  // Log a safe hint to server console without secrets
  const safe = url.slice(0, 24).replace(/:\/\/.*/, '://…');
  console.error("Invalid DATABASE_URL proto; got:", safe || "<empty>");
}

const g = globalThis as unknown as { __prisma_node__?: PrismaClient };

export const prismaNode =
  g.__prisma_node__ ?? new PrismaClient({ datasources: { db: { url } } });
if (process.env.NODE_ENV !== "production") g.__prisma_node__ = prismaNode;

export default prismaNode;
