import { PrismaClient } from "@prisma/client";
import { ensureProjectForEventTitle } from "../src/lib/finance/projectLink";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find(arg => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1] ?? "") : undefined;

  if (limitArg && Number.isNaN(limit)) {
    throw new Error(`Invalid --limit value: ${limitArg}`);
  }

  const events = await prisma.event.findMany({
    where: { projectId: null },
    select: { id: true, title: true },
    orderBy: { startsAt: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  let linked = 0;
  const unresolved: Array<{ id: string; title: string | null }> = [];

  for (const event of events) {
    const linkage = await ensureProjectForEventTitle(event.title ?? "");
    if (!linkage) {
      unresolved.push({ id: event.id, title: event.title });
      continue;
    }

    if (!dryRun) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          projectId: linkage.projectId,
          customerId: linkage.customerId,
        },
      });
    }

    linked += 1;
  }

  console.log(`Scanned ${events.length} events lacking projectId.`);
  console.log(`Linked: ${linked}${dryRun ? " (dry-run)" : ""}`);
  console.log(`Unresolved (missing colon or customer): ${unresolved.length}`);

  if (unresolved.length) {
    console.log("Examples of unresolved events:");
    unresolved.slice(0, 10).forEach(ev => {
      console.log(` - ${ev.id}: ${ev.title ?? "(no title)"}`);
    });
    if (unresolved.length > 10) {
      console.log(` …and ${unresolved.length - 10} more.`);
    }
  }

  if (dryRun) {
    console.log("Dry run complete. Re-run without --dry-run to persist changes.");
  }
}

main()
  .catch(error => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
