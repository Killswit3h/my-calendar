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

  const prisma = await getPrisma();
  const overrides = await prisma.placement.findMany({
    where: { dayKey },
    select: { employeeId: true, placement: true },
  });

  const free: string[] = [];
  const yardShop: string[] = [];
  const noWork: string[] = [];
  const explicitKeys: string[] = [];

  for (const o of overrides) {
    explicitKeys.push(o.employeeId);
    if (o.placement === 'FREE') free.push(o.employeeId);
    else if (o.placement === 'YARD_SHOP') yardShop.push(o.employeeId);
    else if (o.placement === 'NO_WORK') noWork.push(o.employeeId);
  }

  const counts = {
    free: free.length,
    yardShop: yardShop.length,
    noWork: noWork.length,
  };

  const sample = {
    free: free.slice(0, 5),
    yardShop: yardShop.slice(0, 5),
    noWork: noWork.slice(0, 5),
    explicitKeys,
  };

  const dbg = { dateISO, counts, sample };
  console.log('getDayRoster dbg', dbg);

  return { dateISO, counts, sample };
}
