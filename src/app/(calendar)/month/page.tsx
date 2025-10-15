import { addDays, endOfMonth, startOfMonth } from "date-fns";
import MonthView from "@/components/calendar/MonthView";
import { getEventsOverlapping } from "@/lib/events";

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const params = await searchParams;
  const base = params?.d ? new Date(params.d) : new Date();
  const start = addDays(startOfMonth(base), -7);
  const end   = addDays(endOfMonth(base), 7);
  const events = await getEventsOverlapping(start, end);
  return <MonthView monthDate={base} events={events} />;
}
