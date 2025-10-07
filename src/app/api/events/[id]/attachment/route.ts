// src/app/api/events/[id]/attachment/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getPrisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const p = await getPrisma()

  let ev: { attachmentData: Uint8Array | null; attachmentName: string | null; attachmentType: string | null } | null
  try {
    ev = await p.event.findUnique({
      where: { id },
      select: { attachmentData: true, attachmentName: true, attachmentType: true },
    })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    if (msg.includes("Can't reach database server") || msg.includes('P1001')) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      })
    }
    throw e
  }

  if (!ev || !ev.attachmentData) {
    return new Response(JSON.stringify({ error: 'No attachment' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  }

  const body =
    ev.attachmentData instanceof Uint8Array
      ? ev.attachmentData
      : new Uint8Array(ev.attachmentData as any)

  const arrayBuffer = body.buffer.slice(
    body.byteOffset,
    body.byteOffset + body.byteLength,
  ) as ArrayBuffer

  const filename = (ev.attachmentName ?? 'file').replace(/\//g, '')
  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': ev.attachmentType ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  })
}
