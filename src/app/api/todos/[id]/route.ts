// src/app/api/todos/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const row = await tryPrisma(p => p.calendarTodo.findUnique({ where: { id } }), null as any)
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const b = await req.json().catch(() => ({} as any))
  const updated = await tryPrisma(
    p =>
      p.calendarTodo.update({
        where: { id },
        data: {
          ...(b.title !== undefined ? { title: String(b.title) } : {}),
          ...(b.notes !== undefined ? { notes: String(b.notes ?? '') } : {}),
          ...(b.done !== undefined ? { done: !!b.done } : {}),
          ...(b.type !== undefined ? { type: b.type ?? null } : {}),
        },
      }),
    null as any,
  )
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await tryPrisma(p => p.calendarTodo.delete({ where: { id }, select: { id: true } }), null as any)
  return new NextResponse(null, { status: 204 })
}
