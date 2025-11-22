import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/lib/db';

export async function GET() {
  const prisma = await getPrisma();
  const plans = await prisma.plannerPlan.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true, color: true, createdAt: true },
  });
  return NextResponse.json({ plans });
}

const CreatePlan = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  userId: z.string().optional().default('system'),
});

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  const body = await req.json().catch(() => ({}));
  const parsed = CreatePlan.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, ...data } = parsed.data;
  const plan = await prisma.plannerPlan.create({
    data,
    select: { id: true, name: true, description: true, color: true, createdAt: true },
  });

  await prisma.plannerActivity.create({
    data: {
      planId: plan.id,
      taskId: null,
      userId,
      type: 'PLAN_CREATED',
      meta: { name: plan.name },
    },
  }).catch(() => undefined);

  return NextResponse.json({ plan }, { status: 201 });
}
