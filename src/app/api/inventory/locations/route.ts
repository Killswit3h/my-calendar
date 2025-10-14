export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'

import { createInventoryLocation, listInventoryLocations, type InventoryLocationCreateInput } from '@/server/inventory'

import { inventoryErrorResponse, readJsonBody } from '../_lib/http'

export async function GET() {
  try {
    const locations = await listInventoryLocations()
    return NextResponse.json({ locations })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<InventoryLocationCreateInput>(req)
    const location = await createInventoryLocation(body)
    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    return inventoryErrorResponse(error)
  }
}
