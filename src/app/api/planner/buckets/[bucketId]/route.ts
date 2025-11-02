import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../../lib/db';

export const runtime = 'nodejs';

const PatchBucket = z.object({
  name: z.string().min(1).optional(),
  order: z.number().optional(),
  userId: z.string().optional().default('system'),
});

export async function PATCH(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const bucketId = params?.bucketId;
  if (!bucketId) return NextResponse.json({ error: 'Missing bucketId' }, { status: 400 });

  const body = await req.json();
  const parsed = PatchBucket.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, ...data } = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  const bucket = await prisma.plannerBucket.update({
    where: { id: bucketId },
    data,
    select: { id: true, name: true, order: true, planId: true },
  });

  await prisma.plannerActivity.create({
    data: {
      planId: bucket.planId,
      taskId: null,
      userId,
      type: 'BUCKET_UPDATED',
      meta: { bucketId: bucket.id, fields: Object.keys(data) },
    },
  });

  return NextResponse.json({ bucket });
}

export async function DELETE(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  const bucketId = params?.bucketId;
  if (!bucketId) return NextResponse.json({ error: 'Missing bucketId' }, { status: 400 });

  let userId = 'system';
  try {
    const body = await req.json();
    if (body && typeof body.userId === 'string') userId = body.userId;
  } catch {
    // ignore body parse failure
  }

  const bucket = await prisma.plannerBucket.findUnique({
    where: { id: bucketId },
    select: { id: true, name: true, planId: true },
  });
  if (!bucket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.plannerBucket.delete({ where: { id: bucketId } });

  await prisma.plannerActivity.create({
    data: {
      planId: bucket.planId,
      taskId: null,
      userId,
      type: 'BUCKET_DELETED',
      meta: { bucketId, name: bucket.name },
    },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
