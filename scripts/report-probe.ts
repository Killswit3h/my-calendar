import { fetchReportEventsWithDiagnostics } from '@/server/reports/queries'
import { getPrisma } from '@/lib/db'

function parseArgs(argv: string[]): { date: string; vendor: string | null } {
  let date: string | null = null
  let vendor: string | null = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('-') && !date) {
      date = arg
      continue
    }
    if (arg.startsWith('--vendor=')) {
      vendor = arg.slice('--vendor='.length)
      continue
    }
    if (arg === '--vendor' || arg === '-v') {
      vendor = argv[i + 1] ?? ''
      i++
      continue
    }
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Usage: npm run report:probe -- YYYY-MM-DD [--vendor <name>]')
    process.exit(1)
  }

  return { date, vendor: vendor?.trim() ? vendor.trim() : null }
}

async function main() {
  const { date, vendor } = parseArgs(process.argv.slice(2))

  try {
    const { rows, diagnostics } = await fetchReportEventsWithDiagnostics(date, vendor)

    console.log('Report date:', diagnostics.reportDate)
    console.log('Vendor:', diagnostics.vendor ?? '—')
    console.log('Mode:', diagnostics.reportMode)
    console.log('Storage:', diagnostics.storageMode)
    console.log('APP_TZ:', diagnostics.appTz)
    console.log('dayStartET:', diagnostics.dayStartET)
    console.log('dayEndET:', diagnostics.dayEndET)
    console.log('dayStartUTC:', diagnostics.dayStartUTC)
    console.log('dayEndUTC:', diagnostics.dayEndUTC)
    console.log('Predicate:', diagnostics.predicate)
    console.log('SQL:\n' + diagnostics.sql)
    console.log('Matched rows:', rows.length)

    if (rows.length) {
      console.log('Event IDs:')
      for (const row of rows) {
        const id = row.id ?? 'unknown'
        const startsAt = row.startsAt instanceof Date ? row.startsAt.toISOString() : String(row.startsAt)
        const endsAt = row.endsAt instanceof Date ? row.endsAt.toISOString() : String(row.endsAt)
        console.log(`- ${id} | ${startsAt} -> ${endsAt}`)
      }
    }
  } catch (error) {
    console.error('Failed to probe report:', (error as Error)?.message ?? error)
    process.exitCode = 1
  } finally {
    try {
      const prisma = await getPrisma()
      await prisma.$disconnect()
    } catch (_) {
      // ignore disconnect errors
    }
  }
}

void main()
