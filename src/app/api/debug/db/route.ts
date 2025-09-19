export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export async function GET() {
  try {
    const prisma = await getPrisma();

    const host = new URL(process.env.DATABASE_URL!).host;

    const count = await prisma.event.count();
    const first = await prisma.event.findMany({
      orderBy: { start: 'asc' },
      take: 5,
      select: { id: true, title: true, start: true, end: true, allDay: true },
    });

    const sample = first.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.start,
      endsAt: e.end,
      allDay: e.allDay,
    }));

    return NextResponse.json({ host, count, sample });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
