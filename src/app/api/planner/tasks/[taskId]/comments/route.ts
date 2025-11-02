import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/db';

export async function GET(_req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ comments: [] });

  const comments = await prisma.plannerComment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ comments });
}

const Create = z.object({
  userId: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  const body = await req.json();
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const comment = await prisma.plannerComment.create({
    data: { taskId, userId: parsed.data.userId, body: parsed.data.body },
  });

  const planId = (await prisma.plannerTask.findUnique({ where: { id: taskId }, select: { planId: true } }))!.planId;
  await prisma.plannerActivity.create({
    data: { planId, taskId, userId: parsed.data.userId, type: 'COMMENT_ADDED', meta: {} },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
