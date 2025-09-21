export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export async function GET() {
  try {
    const prisma = await getPrisma();

    const host = new URL(process.env.DATABASE_URL!).host;

    const count = await prisma.event.count();
    const first: { id: string; title: string; startsAt: Date; endsAt: Date; allDay: boolean }[] = await prisma.event.findMany({
      orderBy: { startsAt: 'asc' },
      take: 5,
      select: { id: true, title: true, startsAt: true, endsAt: true, allDay: true },
    });

    const sample = first.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      allDay: e.allDay,
    }));

    return NextResponse.json({ host, count, sample });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

