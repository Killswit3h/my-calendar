import { NextResponse } from 'next/server';
import prisma from '@/src/lib/db';

export async function GET(_req: Request, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ activity: [] });

  const items = await prisma.plannerActivity.findMany({
    where: { planId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, taskId: true, userId: true, type: true, meta: true, createdAt: true },
  });
  return NextResponse.json({ activity: items });
}
