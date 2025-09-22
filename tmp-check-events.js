const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='Event' ORDER BY column_name`;
  console.log(cols.map(c => c.column_name));
  await prisma.$disconnect();
})();
