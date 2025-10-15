// src/lib/fixAllDay.ts
import { isSameDay, endOfDay } from "date-fns";
export function fixAllDayIfCollapsed(start: Date, end: Date) {
  // Collapsed all-day like: start 2025-10-10 00:00, end 2025-10-10 00:00
  if (isSameDay(start, end) && end.getHours() === 0 && end.getMinutes() === 0) {
    return endOfDay(start);
  }
  return end;
}
