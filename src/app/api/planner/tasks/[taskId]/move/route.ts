import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/db';

const Move = z.object({
  toBucketId: z.string().min(1),
  beforeTaskId: z.string().optional(),
  userId: z.string().optional().default('system'),
});

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  const body = await req.json();
  const parsed = Move.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const current = await prisma.plannerTask.findUnique({ where: { id: taskId }, select: { bucketId: true, order: true, planId: true } });
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let newOrder: number;
  if (parsed.data.beforeTaskId) {
    const before = await prisma.plannerTask.findUnique({ where: { id: parsed.data.beforeTaskId }, select: { order: true, bucketId: true } });
    if (!before) return NextResponse.json({ error: 'beforeTaskId invalid' }, { status: 400 });
    newOrder = before.order - 1;
  } else {
    const last = await prisma.plannerTask.findFirst({
      where: { bucketId: parsed.data.toBucketId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    newOrder = (last?.order ?? 0) + 100;
  }

  const moved = await prisma.plannerTask.update({
    where: { id: taskId },
    data: { bucketId: parsed.data.toBucketId, order: newOrder },
    select: { id: true, bucketId: true, order: true },
  });

  await prisma.plannerActivity.create({
    data: {
      planId: current.planId,
      taskId,
      userId: parsed.data.userId,
      type: 'TASK_MOVED',
      meta: { from: current.bucketId, to: parsed.data.toBucketId },
    },
  });

  return NextResponse.json({ moved });
}
