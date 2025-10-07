export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { APP_TZ } from '@/lib/appConfig'

type MaybeString = string | null | undefined

function maskUrl(value: MaybeString): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.username) url.username = '***'
    if (url.password) url.password = '***'
    return url.toString()
  } catch {
    return value
  }
}

function hostOf(value: MaybeString): string | null {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL ?? null
  const directUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DIRECT_URL ?? null
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL ?? null

  return NextResponse.json({
    databaseUrlPresent: !!databaseUrl,
    databaseUrlHost: hostOf(databaseUrl),
    databaseUrlMasked: maskUrl(databaseUrl),
    directUrlPresent: !!directUrl,
    directUrlHost: hostOf(directUrl),
    directUrlMasked: maskUrl(directUrl),
    prismaAccelerateUrlConfigured: !!accelerateUrl,
    nodeEnv: process.env.NODE_ENV ?? null,
    reportTimezone: process.env.REPORT_TIMEZONE ?? null,
    appTimezone: APP_TZ,
  })
}
