import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/db';

export async function GET(_req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ items: [] });

  const items = await prisma.plannerChecklistItem.findMany({
    where: { taskId },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({ items });
}

const Create = z.object({ title: z.string().min(1) });

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  const body = await req.json();
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const last = await prisma.plannerChecklistItem.findFirst({
    where: { taskId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const order = (last?.order ?? 0) + 100;

  const item = await prisma.plannerChecklistItem.create({
    data: { taskId, title: parsed.data.title, order },
  });

  const planId = (await prisma.plannerTask.findUnique({ where: { id: taskId }, select: { planId: true } }))!.planId;
  await prisma.plannerActivity.create({
    data: { planId, taskId, userId: 'system', type: 'CHECKLIST_ADDED', meta: { title: parsed.data.title } },
  });

  return NextResponse.json({ item }, { status: 201 });
}
