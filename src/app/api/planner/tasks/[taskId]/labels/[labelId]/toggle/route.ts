import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/db';

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  const labelId = params?.labelId;
  if (!taskId || !labelId) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const userId = typeof body?.userId === 'string' ? body.userId : 'system';

  const exists = await prisma.plannerTaskLabelOnTask.findUnique({ where: { taskId_labelId: { taskId, labelId } } });
  const task = await prisma.plannerTask.findUnique({ where: { id: taskId }, select: { planId: true } });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  if (exists) {
    await prisma.plannerTaskLabelOnTask.delete({ where: { taskId_labelId: { taskId, labelId } } });
    await prisma.plannerActivity.create({ data: { planId: task.planId, taskId, userId, type: 'LABEL_TOGGLED', meta: { labelId, added: false } } });
    return NextResponse.json({ removed: true });
  }
  await prisma.plannerTaskLabelOnTask.create({ data: { taskId, labelId } });
  await prisma.plannerActivity.create({ data: { planId: task.planId, taskId, userId, type: 'LABEL_TOGGLED', meta: { labelId, added: true } } });
  return NextResponse.json({ added: true });
}
