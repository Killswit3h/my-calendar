import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../../lib/db';

const PatchTask = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['URGENT','IMPORTANT','MEDIUM','LOW']).optional(),
  progress: z.enum(['NOT_STARTED','IN_PROGRESS','COMPLETED']).optional(),
  startAt: z.string().datetime().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  userId: z.string().optional().default('system'),
});

export async function PATCH(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  const body = await req.json();
  const parsed = PatchTask.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: any = { ...parsed.data };
  const userId = data.userId; delete data.userId;
  if ('startAt' in data) data.startAt = data.startAt ? new Date(data.startAt) : null;
  if ('dueAt' in data) data.dueAt = data.dueAt ? new Date(data.dueAt) : null;

  const before = await prisma.plannerTask.findUnique({ where: { id: taskId } });
  const task = await prisma.plannerTask.update({
    where: { id: taskId },
    data,
    select: { id: true, title: true, description: true, priority: true, progress: true, startAt: true, dueAt: true, bucketId: true, order: true },
  });

  await prisma.plannerActivity.create({
    data: {
      planId: before!.planId,
      taskId: task.id,
      userId,
      type: 'TASK_UPDATED',
      meta: { changes: Object.keys(data) },
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  let userId = 'system';
  try {
    const body = await req.json();
    if (body && typeof body.userId === 'string') {
      userId = body.userId;
    }
  } catch {
    // ignore body parse errors, default userId stays 'system'
  }

  const existing = await prisma.plannerTask.findUnique({
    where: { id: taskId },
    select: { planId: true, title: true },
  });

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.plannerTask.delete({ where: { id: taskId } });

  await prisma.plannerActivity.create({
    data: {
      planId: existing.planId,
      taskId,
      userId,
      type: 'TASK_DELETED',
      meta: { title: existing.title },
    },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
