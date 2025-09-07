import { prisma, tryPrisma } from '@/lib/dbSafe'

const NAGER = (year: number, cc: string) =>
  `https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`

export type HolidayItem = {
  date: Date
  localName: string
  name: string
  countryCode: string
}

/** Fetch from Nager API and normalize to UTC dates. */
async function fetchNager(year: number, cc: string): Promise<HolidayItem[]> {
  const res = await fetch(NAGER(year, cc), {
    next: { revalidate: 60 * 60 * 24 * 14 },
  })
  if (!res.ok) throw new Error(`Holiday fetch failed: ${res.status}`)
  const data: Array<{
    date: string
    localName: string
    name: string
    countryCode: string
  }> = await res.json()
  return data.map((h) => ({
    date: new Date(h.date + 'T00:00:00Z'),
    localName: h.localName,
    name: h.name,
    countryCode: h.countryCode,
  }))
}

/** Upsert a full year of holidays for a country. */
export async function upsertHolidays(year: number, countryCode: string) {
  const items = await fetchNager(year, countryCode)
  await tryPrisma(() =>
    prisma.$transaction(
      items.map((h) =>
        prisma.holiday.upsert({
          where: { date_countryCode: { date: h.date, countryCode } },
          create: {
            date: h.date,
            localName: h.localName,
            name: h.name,
            countryCode,
          },
          update: { localName: h.localName, name: h.name },
        }),
      ),
    )
  , undefined as any)
}

/** Query cached holidays from DB within [start, end). */
export async function getHolidaysDb(
  start: Date,
  end: Date,
  countryCode: string,
) {
  return tryPrisma(() =>
    prisma.holiday.findMany({
      where: { date: { gte: start, lt: end }, countryCode },
      orderBy: { date: 'asc' },
    })
  , [])
}

/** Ensure DB has coverage for all years in range. */
export async function ensureDbHydrated(
  start: Date,
  end: Date,
  country: string,
) {
  const years = new Set<number>()
  for (
    let y = start.getUTCFullYear();
    y <= end.getUTCFullYear();
    y = y + 1
  ) {
    years.add(y)
  }
  await Promise.all(Array.from(years).map((y) => upsertHolidays(y, country)))
}

/** Main fetch: hydrate if needed then read. */
export async function fetchHolidays(
  start: Date,
  end: Date,
  opts: { countryCode: string },
) {
  try {
    await ensureDbHydrated(start, end, opts.countryCode)
    const rows = await getHolidaysDb(start, end, opts.countryCode)
    if (rows.length > 0) {
      return rows.map((r) => ({
        date: r.date,
        localName: r.localName,
        name: r.name,
        countryCode: r.countryCode,
      }))
    }
  } catch (e) {
    // fall through to direct fetch
  }

  // Fallback: fetch directly without DB cache
  const years = new Set<number>()
  for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) years.add(y)
  const all: HolidayItem[] = []
  for (const y of years) {
    const items = await fetchNager(y, opts.countryCode)
    all.push(...items)
  }
  return all
    .filter((h) => h.date >= start && h.date < end)
    .map((h) => ({
      date: h.date,
      localName: h.localName,
      name: h.name,
      countryCode: h.countryCode,
    }))
}

/** Map items by ISO yyyy-mm-dd for quick lookup. */
export function indexByIsoDate(items: { date: Date }[]) {
  const map = new Map<string, any>()
  for (const it of items) {
    const key = it.date.toISOString().slice(0, 10)
    map.set(key, it)
  }
  return map
}
