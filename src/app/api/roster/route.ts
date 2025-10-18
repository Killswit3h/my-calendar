import { NextResponse } from 'next/server';
import { getDayRoster } from '@/lib/roster';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date'); // YYYY-MM-DD
  const dayKey = date ?? new Date().toISOString().slice(0, 10);
  const roster = await getDayRoster(dayKey);
  return NextResponse.json(roster);
}
