const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const rows = await p.event.findMany({ take: 1, orderBy: { start: 'asc' }, select: { id: true, start: true, end: true } });
    console.log('ok', rows.length, rows[0] ?? null);
  } catch (e) {
    console.error('err', e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
