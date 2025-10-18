// utils/dates.ts
import { differenceInCalendarDays, endOfDay, startOfDay, min, max } from "date-fns";

export function normalizeSpan(startISO: string | Date, endISO: string | Date) {
  const s = new Date(startISO);
  const rawEnd = new Date(endISO);
  const endIsMidnight = rawEnd.getHours() === 0 && rawEnd.getMinutes() === 0 && rawEnd.getSeconds() === 0 && rawEnd.getMilliseconds() === 0;
  const sameDay = s.toDateString() === rawEnd.toDateString();
  const e = endIsMidnight && !sameDay ? new Date(rawEnd.getTime() - 1) : rawEnd;
  return { s, e };
}

export function inclusiveDaySpan(startISO: string | Date, endISO: string | Date) {
  const { s, e } = normalizeSpan(startISO, endISO);
  return differenceInCalendarDays(endOfDay(e), startOfDay(s)) + 1;
}

export function clampToRange(startISO: string | Date, endISO: string | Date, rangeStart: Date, rangeEnd: Date) {
  const { s, e } = normalizeSpan(startISO, endISO);
  return { s: max([s, rangeStart]), e: min([e, rangeEnd]) };
}
