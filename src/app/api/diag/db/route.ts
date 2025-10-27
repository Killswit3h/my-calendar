import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function GET() {
  const url = process.env.DATABASE_URL || "";
  const dbHash = url ? await sha256(url) : "missing";
  const out: any = { db_url_sha256: dbHash, counts: {} };
  try { out.counts.Event = await prisma.event.count(); } catch { out.counts.Event = null; }
  try { out.counts.Employee = await prisma.employee.count(); } catch { out.counts.Employee = null; }
  try {
    const rows = await prisma.$queryRawUnsafe<{ count: bigint | number }[]>(
      'select count(*)::bigint as count from "Project"'
    );
    const value = rows?.[0]?.count;
    out.counts.Project = typeof value === "bigint" ? Number(value) : value ?? null;
  } catch {
    out.counts.Project = null;
  }
  try { out.counts.EventAssignment = await prisma.eventAssignment.count(); } catch { out.counts.EventAssignment = null; }
  return NextResponse.json(out);
}
