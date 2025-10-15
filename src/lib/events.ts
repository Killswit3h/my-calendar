// lib/events.ts
import { getPrisma } from "@/lib/db";

export async function getEventsOverlappingRange(rangeStart: Date, rangeEnd: Date) {
  const prisma = await getPrisma();
  // overlap condition: NOT (endsAt < rangeStart OR startsAt > rangeEnd)
  return prisma.event.findMany({
    where: {
      NOT: {
        OR: [
          { endsAt: { lt: rangeStart } },
          { startsAt: { gt: rangeEnd } },
        ],
      },
    },
    orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }],
  });
}

export async function getEventsOverlapping(rangeStart: Date, rangeEnd: Date) {
  const prisma = await getPrisma();
  // overlap: NOT (endsAt <= rangeStart OR startsAt >= rangeEnd)
  return prisma.event.findMany({
    where: {
      NOT: {
        OR: [
          { endsAt: { lte: rangeStart } },
          { startsAt: { gte: rangeEnd } },
        ],
      },
    },
    orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }],
  });
}
