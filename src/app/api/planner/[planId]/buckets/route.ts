import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/db';

export const runtime = 'nodejs';

const CreateBucket = z.object({
  name: z.string().min(1),
  order: z.number().optional(),
  userId: z.string().optional().default('system'),
});

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const planId = params?.planId;
  if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

  const body = await req.json();
  const parsed = CreateBucket.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, userId, order } = parsed.data;

  const nextOrder =
    typeof order === 'number'
      ? order
      : ((await prisma.plannerBucket.findFirst({
          where: { planId },
          orderBy: { order: 'desc' },
          select: { order: true },
        }))?.order ?? 0) + 100;

  const bucket = await prisma.plannerBucket.create({
    data: { planId, name, order: nextOrder },
    select: { id: true, name: true, order: true, planId: true },
  });

  await prisma.plannerActivity.create({
    data: {
      planId,
      taskId: null,
      userId,
      type: 'BUCKET_CREATED',
      meta: { bucketId: bucket.id, name },
    },
  });

  return NextResponse.json({ bucket }, { status: 201 });
}
