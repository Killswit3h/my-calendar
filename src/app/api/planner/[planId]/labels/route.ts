import { NextResponse } from 'next/server';
import prisma from '@/src/lib/db';

export async function GET(_req: Request, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ labels: [] });

  const labels = await prisma.plannerLabel.findMany({
    where: { planId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, color: true },
  });
  return NextResponse.json({ labels });
}
