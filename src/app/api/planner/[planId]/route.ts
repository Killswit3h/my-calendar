import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/lib/db';

export async function GET(_req: Request, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const prisma = await getPrisma();
  const plan = await prisma.plannerPlan.findUnique({
    where: { id: planId },
    select: {
      id: true, name: true, description: true, color: true, createdAt: true,
      buckets: {
        orderBy: { order: 'asc' },
        select: {
          id: true, name: true, order: true,
          tasks: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, description: true, priority: true, progress: true, dueAt: true, order: true },
          },
        },
      },
    },
  });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ plan });
}
