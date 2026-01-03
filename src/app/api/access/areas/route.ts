import { NextResponse } from 'next/server'

import { getUserAreas } from '@/lib/access'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null, areas: [] })

  const areas = await getUserAreas(user.id)
  return NextResponse.json({ user, areas })
}










