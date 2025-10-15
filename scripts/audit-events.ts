import { getPrisma } from "../src/lib/db";

async function auditEvents() {
  const prisma = await getPrisma();
  
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
    },
    orderBy: { startsAt: 'desc' },
    take: 10
  });

  console.log('Recent events:');
  events.forEach((e: any) => {
    const start = new Date(e.startsAt);
    const end = new Date(e.endsAt);
    const endIsMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log({
      title: e.title,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      allDay: e.allDay,
      endIsMidnight,
      dayDiff,
      isMultiDay: dayDiff >= 1
    });
  });

  // Count multi-day events
  const allEvents = await prisma.event.findMany({
    select: {
      startsAt: true,
      endsAt: true,
    }
  });

  let multiDayTotal = 0;
  let multiDayMidnightEnd = 0;
  let multiDayNonMidnightEnd = 0;

  allEvents.forEach((e: any) => {
    const start = new Date(e.startsAt);
    const end = new Date(e.endsAt);
    const endIsMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff >= 1) {
      multiDayTotal++;
      if (endIsMidnight) {
        multiDayMidnightEnd++;
      } else {
        multiDayNonMidnightEnd++;
      }
    }
  });

  console.log('\nSummary:');
  console.log(`Multi-day total: ${multiDayTotal}`);
  console.log(`Multi-day midnight end: ${multiDayMidnightEnd}`);
  console.log(`Multi-day non-midnight end: ${multiDayNonMidnightEnd}`);
}

auditEvents().finally(() => process.exit(0));
