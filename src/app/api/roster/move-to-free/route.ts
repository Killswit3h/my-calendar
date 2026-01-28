import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { getDayRoster } from '@/lib/roster';

export const dynamic = 'force-dynamic';

type Body = { employeeId: string; dayKey?: string; dateISO?: string };

export async function POST(req: Request) {
  try {
    const { employeeId, dayKey, dateISO } = (await req.json()) as Body;

    const resolvedDayKey =
      dayKey ??
      (dateISO ? dateISO.slice(0, 10) : new Date().toISOString().slice(0, 10));

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId required' },
        { status: 400 }
      );
    }

    // Ensure YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resolvedDayKey)) {
      return NextResponse.json(
        { error: 'dayKey must be YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Placement model not available
    return NextResponse.json({ ok: true, roster: { free: [], yardShop: [], noWork: [] } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? 'unknown error' },
      { status: 500 }
    );
  }
}



