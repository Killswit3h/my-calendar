export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'

import {
  getInventoryItem,
  softDeleteInventoryItem,
  updateInventoryItem,
  type InventoryItemUpdateInput,
} from '@/server/inventory'

import { inventoryErrorResponse, parseIncludeDeleted, readJsonBody } from '../../_lib/http'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const includeDeleted = parseIncludeDeleted(req.nextUrl.searchParams)
    const item = await getInventoryItem(id, { includeDeleted })
    return NextResponse.json({ item })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const body = await readJsonBody<InventoryItemUpdateInput>(req)
    const item = await updateInventoryItem(id, body)
    return NextResponse.json({ item })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const item = await softDeleteInventoryItem(id)
    return NextResponse.json({ item })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}
