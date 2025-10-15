import { getPrisma } from '@/lib/db';
import MonthView from '@/components/calendar/MonthView';
import BackButton from '@/components/BackButton';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getEventsForMonth(monthDate: Date) {
  const prisma = await getPrisma();
  
  // Get events that overlap with the month (with buffer)
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  
  // Add buffer to catch events that start before or end after the month
  const bufferStart = new Date(monthStart);
  bufferStart.setDate(bufferStart.getDate() - 7);
  const bufferEnd = new Date(monthEnd);
  bufferEnd.setDate(bufferEnd.getDate() + 7);
  
  const events = await prisma.event.findMany({
    where: {
      NOT: {
        OR: [
          { endsAt: { lte: bufferStart } },
          { startsAt: { gte: bufferEnd } },
        ],
      },
    },
    orderBy: [{ startsAt: 'asc' }, { endsAt: 'asc' }],
  });
  
  return events.map((event: any) => ({
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    type: event.type,
  }));
}

export default async function CalendarPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ d?: string }> 
}) {
  const params = await searchParams;
  const monthDate = params.d ? new Date(params.d) : new Date();
  const events = await getEventsForMonth(monthDate);
  
  return (
    <main className="w-full max-w-full space-y-6">
      <BackButton />
      <header>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-muted">Manage your events and schedule</p>
      </header>

      <section className="card p-2 md:p-4 overflow-hidden">
        <div className="w-full">
          <MonthView monthDate={monthDate} events={events} />
        </div>
      </section>
    </main>
  );
}