// app/(calendar)/month/page.tsx
import { startOfMonth, endOfMonth, addDays } from "date-fns";
import { getEventsOverlapping } from "@/lib/events";
import MonthView from "@/components/calendar/MonthView";

export default async function MonthPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const params = await searchParams;
  const base = params?.d ? new Date(params.d) : new Date();
  const start = addDays(startOfMonth(base), -7); // buffer for leading week
  const end = addDays(endOfMonth(base), 7);      // buffer for trailing week
  const events = await getEventsOverlapping(start, end);
  return <MonthView monthDate={base} events={events} />;
}
