import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

export async function GET(_req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ attachments: [] });

  const attachments = await prisma.plannerAttachment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ attachments });
}

const Create = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const taskId = params?.taskId;
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  const body = await req.json();
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const attachment = await prisma.plannerAttachment.create({
    data: { taskId, ...parsed.data },
  });

  const planId = (await prisma.plannerTask.findUnique({ where: { id: taskId }, select: { planId: true } }))!.planId;
  await prisma.plannerActivity.create({
    data: { planId, taskId, userId: 'system', type: 'ATTACHMENT_ADDED', meta: { name: attachment.name } },
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
