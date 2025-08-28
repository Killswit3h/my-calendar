import { prisma } from '@/lib/prisma'

export type Settings = {
  showHolidays: boolean
  countryCode: string
  useIcs: boolean
  icsUrl?: string | null
}

/** Replace with your auth if available. For now use a single default row. */
function getUserId(): string {
  return 'default-user'
}

/** Ensure a settings row exists, then return it. */
export async function getSettings(): Promise<Settings> {
  const userId = getUserId()
  const s = await prisma.userSetting.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
  return {
    showHolidays: s.showHolidays,
    countryCode: s.countryCode,
    useIcs: s.useIcs,
    icsUrl: s.icsUrl,
  }
}

/** Save partial updates and return the latest settings. */
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const userId = getUserId()
  const s = await prisma.userSetting.update({
    where: { userId },
    data: {
      showHolidays: patch.showHolidays ?? undefined,
      countryCode: patch.countryCode?.toUpperCase() ?? undefined,
      useIcs: patch.useIcs ?? undefined,
      icsUrl: patch.icsUrl ?? undefined,
    },
  })
  return {
    showHolidays: s.showHolidays,
    countryCode: s.countryCode,
    useIcs: s.useIcs,
    icsUrl: s.icsUrl,
  }
}
