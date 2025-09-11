import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { normalizeCustomerName } from "../../../lib/customers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").trim();
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || 20)));
  try {
    const items = await prisma.customer.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
      take: limit,
      select: { id: true, name: true },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

// Basic per-IP rate limit for create: 20/minute
const rl = new Map<string, { count: number; ts: number }>();
function rateLimitOk(ip: string) {
  const now = Date.now();
  const rec = rl.get(ip);
  if (!rec || now - rec.ts > 60_000) { rl.set(ip, { count: 1, ts: now }); return true; }
  rec.count++;
  if (rec.count > 20) return false;
  return true;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (!rateLimitOk(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  try {
    const body = await req.json().catch(() => ({} as any));
    const nameRaw = typeof body?.name === "string" ? body.name : "";
    const { compare, display } = normalizeCustomerName(nameRaw);
    if (!display) return NextResponse.json({ error: "blank" }, { status: 400 });

    // Case-insensitive de-dupe: find any existing by equals-insensitive
    const existing = await prisma.customer.findFirst({ where: { name: { equals: display, mode: "insensitive" } }, select: { id: true, name: true } });
    if (existing) return NextResponse.json(existing);

    const created = await prisma.customer.create({ data: { name: display }, select: { id: true, name: true } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
