// src/app/api/health/db/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function GET() {
  const p = await getPrisma()
  await p.$queryRaw`SELECT 1`
  return NextResponse.json({ ok: true })
}
