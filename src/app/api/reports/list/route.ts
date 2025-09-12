import { NextRequest, NextResponse } from "next/server";
import { prismaNode as prisma } from "@/lib/prismaNode";

export const runtime = 'nodejs'

function okRole(): boolean { return true; }

export async function GET(req: NextRequest) {
  if (!okRole()) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') as any;
  const date = url.searchParams.get('date');
  const weekStart = url.searchParams.get('weekStart');
  const weekEnd = url.searchParams.get('weekEnd');
  const vendor = url.searchParams.get('vendor');

  const where: any = {};
  if (kind) where.kind = kind;
  if (date) where.reportDate = new Date(date);
  if (weekStart) where.weekStart = new Date(weekStart);
  if (weekEnd) where.weekEnd = new Date(weekEnd);
  if (vendor) where.vendor = vendor;

  const items = await prisma.reportFile.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ items });
}

