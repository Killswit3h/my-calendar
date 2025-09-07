import { prisma, tryPrisma } from '@/lib/dbSafe'

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
  const s = await tryPrisma(() =>
    prisma.userSetting.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
  , { showHolidays: true, countryCode: 'US', useIcs: false, icsUrl: null } as any)
  return {
    showHolidays: (s as any).showHolidays ?? true,
    countryCode: (s as any).countryCode ?? 'US',
    useIcs: (s as any).useIcs ?? false,
    icsUrl: (s as any).icsUrl ?? null,
  }
}

/** Save partial updates and return the latest settings. */
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const userId = getUserId()
  const s = await tryPrisma(() =>
    prisma.userSetting.update({
      where: { userId },
      data: {
        showHolidays: patch.showHolidays ?? undefined,
        countryCode: patch.countryCode?.toUpperCase() ?? undefined,
        useIcs: patch.useIcs ?? undefined,
        icsUrl: patch.icsUrl ?? undefined,
      },
    })
  , { showHolidays: true, countryCode: 'US', useIcs: false, icsUrl: null } as any)
  return {
    showHolidays: (s as any).showHolidays ?? true,
    countryCode: (s as any).countryCode ?? 'US',
    useIcs: (s as any).useIcs ?? false,
    icsUrl: (s as any).icsUrl ?? null,
  }
}
