import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { getDayRoster } from '@/lib/roster';

export const dynamic = 'force-dynamic';

type Body = { employeeId: string; dayKey: string };

export async function POST(req: Request) {
  try {
    const { employeeId, dayKey } = (await req.json()) as Body;
    if (!employeeId || !dayKey) {
      return NextResponse.json({ error: 'employeeId and dayKey required' }, { status: 400 });
    }

    const prisma = await getPrisma();
    await prisma.placement.deleteMany({ where: { employeeId, dayKey } });

    const roster = await getDayRoster(dayKey);
    return NextResponse.json({ ok: true, roster });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}
