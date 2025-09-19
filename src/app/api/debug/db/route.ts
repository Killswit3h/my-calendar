export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export async function GET() {
  try {
    const prisma = await getPrisma();

    const host = new URL(process.env.DATABASE_URL!).host;

    const count = await prisma.event.count();
    const first = await prisma.event.findMany({
      orderBy: { startsAt: 'asc' },
      take: 5,
      select: { id: true, title: true, startsAt: true, endsAt: true, allDay: true },
    });

    return NextResponse.json({ host, count, sample: first });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
