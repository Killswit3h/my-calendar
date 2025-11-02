import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/db';

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  const userId = params?.userId;
  if (!taskId || !userId) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const actor = typeof body?.actorId === 'string' ? body.actorId : 'system';

  const exists = await prisma.plannerTaskAssignment.findFirst({ where: { taskId, userId } });
  const task = await prisma.plannerTask.findUnique({ where: { id: taskId }, select: { planId: true } });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  if (exists) {
    await prisma.plannerTaskAssignment.delete({ where: { id: exists.id } });
    await prisma.plannerActivity.create({ data: { planId: task.planId, taskId, userId: actor, type: 'ASSIGNEE_TOGGLED', meta: { assigneeId: userId, added: false } } });
    return NextResponse.json({ removed: true });
  }
  await prisma.plannerTaskAssignment.create({ data: { taskId, userId } });
  await prisma.plannerActivity.create({ data: { planId: task.planId, taskId, userId: actor, type: 'ASSIGNEE_TOGGLED', meta: { assigneeId: userId, added: true } } });
  return NextResponse.json({ added: true });
}
