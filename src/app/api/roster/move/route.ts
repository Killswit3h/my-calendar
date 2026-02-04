import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { getDayRoster } from '@/lib/roster';

export const dynamic = 'force-dynamic';

type Body = { employeeId: string; dayKey: string; placement: 'FREE' | 'YARD_SHOP' | 'NO_WORK' };

export async function POST(req: Request) {
  try {
    const { employeeId, dayKey, placement } = (await req.json()) as Body;
    if (!employeeId || !dayKey || !placement) {
      return NextResponse.json({ error: 'employeeId, dayKey, placement required' }, { status: 400 });
    }

    const prisma = await getPrisma();

    // Optional employee registry
    await prisma.employee.upsert({
      where: { id: employeeId },
      update: {},
      create: { id: employeeId },
    });

    await prisma.placement.upsert({
      where: { employeeId_dayKey: { employeeId, dayKey } },
      update: { placement },
      create: { employeeId, dayKey, placement },
    });

    const roster = await getDayRoster(dayKey);
    return NextResponse.json({ ok: true, roster });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}
