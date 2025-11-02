import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/db';

const Patch = z.object({
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
  order: z.number().optional(),
});

export async function PATCH(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const itemId = params?.itemId;
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });

  const body = await req.json();
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await prisma.plannerChecklistItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  const planId = (await prisma.plannerTask.findUnique({ where: { id: item.taskId }, select: { planId: true } }))!.planId;
  await prisma.plannerActivity.create({
    data: { planId, taskId: item.taskId, userId: 'system', type: 'CHECKLIST_UPDATED', meta: { itemId: item.id } },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const itemId = params?.itemId;
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });

  const existing = await prisma.plannerChecklistItem.findUnique({ where: { id: itemId }, select: { id: true, taskId: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.plannerChecklistItem.delete({ where: { id: itemId } });
  const planId = (await prisma.plannerTask.findUnique({ where: { id: existing.taskId }, select: { planId: true } }))!.planId;
  await prisma.plannerActivity.create({
    data: { planId, taskId: existing.taskId, userId: 'system', type: 'CHECKLIST_DELETED', meta: { itemId: existing.id } },
  });

  return NextResponse.json({ ok: true });
}
