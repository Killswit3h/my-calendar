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

    // Placement model not available
    return NextResponse.json({ ok: true, roster: { free: [], yardShop: [], noWork: [] } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}
