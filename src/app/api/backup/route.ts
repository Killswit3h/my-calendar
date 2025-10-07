// src/app/api/backup/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
} as const

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors as any })
}

// Health or dry-run backup trigger
export async function GET(_req: NextRequest) {
  const p = await getPrisma()
  await p.$queryRaw`SELECT 1`
  return NextResponse.json({ ok: true }, { headers: cors as any })
}

// Real backup trigger (fill in your logic)
export async function POST(req: NextRequest) {
  const p = await getPrisma()
  // const b = await req.json().catch(() => ({}))
  // TODO: implement your backup using `p` and your storage (S3/R2/etc.)
  // Example start: const events = await p.event.findMany({ take: 1000 })
  return NextResponse.json({ ok: true }, { status: 201, headers: cors as any })
}
