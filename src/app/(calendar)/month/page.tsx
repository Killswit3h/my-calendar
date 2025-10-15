// app/(calendar)/month/page.tsx
import { startOfMonth, endOfMonth, addDays } from "date-fns";
import { getEventsOverlappingRange } from "@/lib/events";
import { MonthGrid } from "@/components/calendar/MonthGrid";

export default async function MonthPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const params = await searchParams;
  const base = params?.d ? new Date(params.d) : new Date();
  const rangeStart = startOfMonth(base);
  const rangeEnd = endOfMonth(base);
  // fetch with a small buffer to catch week cells that start before/after the month
  const bufferedStart = addDays(rangeStart, -7);
  const bufferedEnd = addDays(rangeEnd, 7);
  const events = await getEventsOverlappingRange(bufferedStart, bufferedEnd);
  return <MonthGrid monthDate={base} events={events} />;
}
