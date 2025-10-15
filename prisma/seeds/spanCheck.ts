import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.event.createMany({
    data: [
      { 
        calendarId: "cme9wqhpe0000ht8sr5o3a6wf",
        title: "Span A", 
        startsAt: new Date("2025-10-08T09:00:00"), 
        endsAt: new Date("2025-10-10T17:00:00"),
        allDay: false
      },
      { 
        calendarId: "cme9wqhpe0000ht8sr5o3a6wf",
        title: "Span B", 
        startsAt: new Date("2025-10-14T00:00:00"), 
        endsAt: new Date("2025-10-17T00:00:00"),
        allDay: true
      }, // all-day 3 days (end exclusive)
    ],
    skipDuplicates: true,
  });
  console.log("Test events created successfully!");
}

main().finally(() => prisma.$disconnect());
