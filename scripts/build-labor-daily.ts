import { buildLaborDaily } from '@/lib/finance/buildLaborDaily'
import { getPrisma } from '@/lib/db'

function parseArgs(): { start: string; end: string } {
  const args = process.argv.slice(2)
  const result: Record<string, string> = {}
  for (let i = 0; i < args.length; i += 1) {
    const [key, value] = args[i]!.split('=')
    if (value === undefined) {
      const next = args[i + 1]
      if (next && !next.startsWith('--')) {
        result[key.replace(/^--/, '')] = next
        i += 1
      }
    } else {
      result[key.replace(/^--/, '')] = value
    }
  }
  const start = result.start
  const end = result.end
  if (!start || !end) {
    throw new Error('Usage: tsx scripts/build-labor-daily.ts --start YYYY-MM-DD --end YYYY-MM-DD')
  }
  return { start, end }
}

async function main() {
  const { start, end } = parseArgs()
  const prisma = await getPrisma()
  const result = await buildLaborDaily({ startDate: start, endDate: end, prisma })
  console.log(
    `Labor daily refreshed for ${start} → ${end}. Rows inserted: ${result.rowsInserted}. Missing rates: ${result.missingRates.length}`,
  )
  await prisma.$disconnect()
}

main().catch(async error => {
  console.error(error)
  try {
    const prisma = await getPrisma()
    await prisma.$disconnect()
  } catch {}
  process.exit(1)
})
