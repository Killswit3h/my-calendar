import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'

import { createInventoryItem, listInventoryItems, type InventoryItemCreateInput } from '@/server/inventory'

import { inventoryErrorResponse, parseIncludeDeleted, readJsonBody } from '../_lib/http'

export async function GET(req: NextRequest) {
  try {
    const includeDeleted = parseIncludeDeleted(req.nextUrl.searchParams)
    const items = await listInventoryItems({ includeDeleted })
    return NextResponse.json({ items })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<InventoryItemCreateInput>(req)
    const item = await createInventoryItem(body)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}
