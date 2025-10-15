// src/lib/events.ts
import { getPrisma } from "@/lib/db";
import { addDays, endOfDay, isSameDay, startOfDay } from "date-fns";
import { fixAllDayIfCollapsed } from "./fixAllDay";

export type CalEvent = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  color?: string | null;
  // ...any fields you need in the chip
};

/** Fetch any event that overlaps [rangeStart, rangeEnd). */
export async function getEventsOverlapping(rangeStart: Date, rangeEnd: Date): Promise<CalEvent[]> {
  const prisma = await getPrisma();
  const rows = await prisma.event.findMany({
    where: {
      NOT: {
        OR: [
          { endsAt:   { lte: rangeStart } }, // ends before range starts
          { startsAt: { gte: rangeEnd   } }, // starts after range ends
        ],
      },
    },
    orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }],
  });

  // Normalize "end at midnight of next day" to end-exclusive semantics
  return rows.map((r: any) => {
    const s = new Date(r.startsAt);
    const e = new Date(r.endsAt);
    const endIsMidnight =
      e.getHours() === 0 && e.getMinutes() === 0 && e.getSeconds() === 0 && e.getMilliseconds() === 0;
    const sameDay = isSameDay(s, e);

    // If end is midnight and spans at least one day, keep e as exclusive (do not subtract a day).
    // If end is midnight and sameDay==true, make it an all-day of that day by bumping to endOfDay.
    const fixedEnd =
      endIsMidnight && sameDay ? fixAllDayIfCollapsed(s, e) : e;

    return { ...r, startsAt: s, endsAt: fixedEnd };
  });
}

/** Helpers used by MonthGrid */
export function clampToRangeInclusive(s: Date, e: Date, rs: Date, re: Date) {
  const start = s < rs ? rs : s;
  const end   = e > re ? re : e;
  return { start, end };
}

export function inclusiveSpanDays(s: Date, e: Date) {
  const start = startOfDay(s).getTime();
  const end   = endOfDay(e).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function weekStartSunday(d: Date) {
  const x = new Date(d); x.setHours(0,0,0,0);
  x.setDate(x.getDate() - x.getDay()); return x;
}
