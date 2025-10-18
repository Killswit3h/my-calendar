// utils/dates.ts
import { addDays, differenceInCalendarDays, endOfDay, isAfter, isBefore, isSameDay, max, min, startOfDay } from "date-fns";

export const toLocal = (d: Date | string) => new Date(d);

export function overlapsDay(eventStart: Date, eventEnd: Date, day: Date) {
  const s = startOfDay(eventStart);
  const e = endOfDay(eventEnd);
  return !(isAfter(s, endOfDay(day)) || isBefore(e, startOfDay(day)));
}

export function clampToRange(eventStart: Date, eventEnd: Date, rangeStart: Date, rangeEnd: Date) {
  const s = max([eventStart, rangeStart]);
  const e = min([eventEnd, rangeEnd]);
  return { s, e };
}

export function daySpanInclusive(eventStart: Date, eventEnd: Date) {
  return differenceInCalendarDays(endOfDay(eventEnd), startOfDay(eventStart)) + 1;
}

export function weekStart(d: Date) {
  // Sunday week start; change if your app uses Monday
  const day = d.getDay();
  const s = new Date(d);
  s.setDate(d.getDate() - day);
  s.setHours(0,0,0,0);
  return s;
}

export function addDaysUTC(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(d.getDate() + n);
  return x;
}

// Additional functions needed by existing components
export function eventOverlapsLocalDay(event: { start: Date | string; end: Date | string; allDay?: boolean }, day: Date) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  
  if (event.allDay) {
    // For all-day events, check if the event overlaps with the day
    const eventStart = startOfDay(start);
    const eventEnd = endOfDay(end);
    return !(eventEnd < dayStart || eventStart > dayEnd);
  } else {
    // For timed events, check if the event overlaps with the day
    return !(end <= dayStart || start >= dayEnd);
  }
}

export function ymdLocal(d: Date | string) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function weekDates(anyDateInView: Date, weekStartsOn: number = 0) {
  const startOfWeek = new Date(anyDateInView);
  const day = startOfWeek.getDay();
  const diff = day - weekStartsOn;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dates.push(date);
  }
  return dates;
}