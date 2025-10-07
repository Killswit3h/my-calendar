// src/lib/appConfig.ts
// Centralized configuration values shared across client and server.

export const APP_TZ = 'America/New_York' as const

export type ReportMode = 'CLAMP' | 'INTERSECT'

function normalizeReportMode(value: string | undefined | null): ReportMode {
  const mode = String(value ?? '').trim().toUpperCase()
  return mode === 'CLAMP' ? 'CLAMP' : 'INTERSECT'
}

export let REPORT_MODE: ReportMode = normalizeReportMode(process.env.REPORT_MODE)

export function __setReportModeForTesting(mode: ReportMode) {
  if (process.env.NODE_ENV === 'test') {
    REPORT_MODE = mode
  }
}

export let DEBUG_REPORT_ENABLED = process.env.DEBUG_REPORT === '1'

export function __setDebugReportForTesting(enabled: boolean) {
  if (process.env.NODE_ENV === 'test') {
    DEBUG_REPORT_ENABLED = enabled
  }
}
