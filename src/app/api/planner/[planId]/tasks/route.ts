import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/db';

export async function GET(_req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ tasks: [] });

  const tasks = await prisma.plannerTask.findMany({
    where: { planId },
    select: { id: true, bucketId: true, title: true, description: true, priority: true, progress: true, startAt: true, dueAt: true, order: true },
    orderBy: [{ bucketId: 'asc' }, { order: 'asc' }],
  });
  return NextResponse.json({ tasks });
}

const CreateTask = z.object({
  bucketId: z.string().min(1),
  title: z.string().min(1),
  userId: z.string().optional().default('system'),
});

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const body = await req.json();
  const parsed = CreateTask.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const last = await prisma.plannerTask.findFirst({
    where: { bucketId: parsed.data.bucketId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const order = (last?.order ?? 0) + 100;

  const task = await prisma.plannerTask.create({
    data: { planId, bucketId: parsed.data.bucketId, title: parsed.data.title, order },
    select: { id: true, title: true, bucketId: true, order: true, priority: true, progress: true, startAt: true, dueAt: true, description: true },
  });

  await prisma.plannerActivity.create({
    data: { planId, taskId: task.id, userId: parsed.data.userId, type: 'TASK_CREATED', meta: { title: task.title } },
  });

  return NextResponse.json({ task }, { status: 201 });
}
