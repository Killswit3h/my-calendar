// src/app/api/customers/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'
import { normalizeCustomerName } from '@/lib/customers'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const item = await tryPrisma(
    p => p.customer.findUnique({ where: { id }, select: { id: true, name: true } }),
    null as any,
  )
  if (!item) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    await tryPrisma(p => p.customer.delete({ where: { id }, select: { id: true } }), null as any)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    if (msg.includes('P2025')) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ error: msg || 'failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({} as any))
  const nameRaw = typeof body?.name === 'string' ? body.name : ''
  const { display } = normalizeCustomerName(nameRaw)
  if (!display) return NextResponse.json({ error: 'blank' }, { status: 400 })

  // Check duplicate, then update in one thunk
  const result = await tryPrisma(
    async p => {
      const dup = await p.customer.findFirst({
        where: { name: { equals: display, mode: 'insensitive' }, NOT: { id } },
        select: { id: true },
      })
      if (dup) return { __dup: true } as any
      return p.customer.update({
        where: { id },
        data: { name: display },
        select: { id: true, name: true },
      })
    },
    null as any,
  )

  if (result?.__dup) return NextResponse.json({ error: 'duplicate' }, { status: 409 })
  return NextResponse.json(result)
}
