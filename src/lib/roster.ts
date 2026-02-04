import { getPrisma } from '@/lib/db';

export type PlacementBucket = 'FREE' | 'YARD_SHOP' | 'NO_WORK';

type Roster = {
  dateISO: string;
  counts: { free: number; yardShop: number; noWork: number };
  sample: {
    free: string[];
    yardShop: string[];
    noWork: string[];
    explicitKeys: string[]; // employees with day override
  };
};

export async function getDayRoster(dayKey: string): Promise<Roster> {
  const dateISO = dayKey;

  // Placement model not available
  const counts = {
    free: 0,
    yardShop: 0,
    noWork: 0,
  };

  const sample = {
    free: [],
    yardShop: [],
    noWork: [],
    explicitKeys: [],
  };

  return { dateISO, counts, sample };
}
