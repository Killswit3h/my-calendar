const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const rows = await p.event.findMany({
      where: { calendarId: 'cme9wqhpe0000ht8sr5o3a6wf' },
      orderBy: { start: 'asc' },
      select: { id: true, calendarId: true, title: true, description: true, start: true, end: true, allDay: true, location: true, type: true },
    });
    console.log('ok', rows.length);
  } catch (e) {
    console.error('err', e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();

