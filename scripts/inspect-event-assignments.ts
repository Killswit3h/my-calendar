import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projectArg = process.argv.find(arg => arg.startsWith("--project="));
  const projectId = projectArg ? projectArg.split("=")[1] : undefined;

  const where: any = { projectId: { not: null } };
  if (projectId) {
    where.projectId = projectId;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      customer: { select: { name: true } },
      project: { select: { name: true } },
      employees: true,
      assignments: {
        select: { employeeId: true },
      },
      laborDailyRows: {
        select: { employeeId: true, hoursDecimal: true, totalCostUsd: true },
      },
    },
  });

  console.log(JSON.stringify(events, null, 2));
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
