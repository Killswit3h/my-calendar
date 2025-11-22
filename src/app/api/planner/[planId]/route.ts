import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const planSelect = {
  id: true,
  name: true,
  description: true,
  color: true,
  createdAt: true,
  labels: { select: { id: true, name: true, color: true } },
  buckets: {
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      order: true,
      tasks: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          progress: true,
          startAt: true,
          dueAt: true,
          order: true,
          bucketId: true,
          labels: { select: { label: { select: { id: true, name: true, color: true } } } },
          assignees: { select: { userId: true } },
        },
      },
    },
  },
} as const;

const normalizePlan = (plan: any) => ({
  ...plan,
  buckets: plan.buckets.map((b: any) => ({
    ...b,
    tasks: b.tasks.map((t: any) => {
      const { labels, assignees, ...rest } = t;
      return {
        ...rest,
        labelList: labels.map((l: any) => l.label),
        assigneeIds: assignees.map((a: any) => a.userId),
      };
    }),
  })),
});

export async function GET(_req: Request, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const plan = await prisma.plannerPlan.findUnique({
    where: { id: planId },
    select: planSelect,
  });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ plan: normalizePlan(plan) });
}

const UpdatePlan = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  userId: z.string().optional().default('system'),
});

export async function PATCH(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const body = await req.json();
  const parsed = UpdatePlan.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, ...data } = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  const updated = await prisma.plannerPlan.update({
    where: { id: planId },
    data,
    select: planSelect,
  });

  await prisma.plannerActivity.create({
    data: {
      planId,
      taskId: null,
      userId,
      type: 'PLAN_UPDATED',
      meta: { fields: Object.keys(data) },
    },
  });

  return NextResponse.json({ plan: normalizePlan(updated) });
}
