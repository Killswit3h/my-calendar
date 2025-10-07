// src/app/api/calendars/[id]/share/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokens = await tryPrisma(
    p => p.shareToken.findMany({
      where: { calendarId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    [] as any[],
  )
  return NextResponse.json(tokens)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({} as any))
  const role = body.role === 'EDITOR' ? 'EDITOR' : 'VIEWER'
  const expiresAt =
    body.expiresAt ? new Date(body.expiresAt) : null
  if (expiresAt && isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: 'invalid expiresAt' }, { status: 400 })
  }

  try {
    const token = await tryPrisma(
      p => p.shareToken.create({ data: { calendarId: id, role, expiresAt } }),
      null as any,
    )
    return NextResponse.json(token, { status: 201 })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    if (msg.includes("Can't reach database server") || msg.includes('P1001')) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }
}
