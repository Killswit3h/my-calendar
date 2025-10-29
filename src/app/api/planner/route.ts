import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/lib/db';

export async function GET() {
  const prisma = await getPrisma();
  const plans = await prisma.plannerPlan.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true, color: true, createdAt: true },
  });
  return NextResponse.json({ plans });
}
