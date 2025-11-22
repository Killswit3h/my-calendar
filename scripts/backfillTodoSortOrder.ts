import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const todos = await prisma.todo.findMany({
    orderBy: [{ listId: "asc" }, { createdAt: "asc" }],
    select: { id: true, listId: true },
  });

  const byList = new Map<string, { id: string; listId: string | null }[]>();

  for (const todo of todos) {
    const key = todo.listId ?? "__null__";
    if (!byList.has(key)) {
      byList.set(key, []);
    }
    byList.get(key)!.push(todo);
  }

  for (const [key, group] of byList.entries()) {
    let sortOrder = 0;
    for (const todo of group) {
      await prisma.todo.update({
        where: { id: todo.id },
        data: {
          sortOrder,
          position: sortOrder,
        },
      });
      sortOrder += 10;
    }
    const label = key === "__null__" ? "(no list)" : key;
    console.log(`Backfilled ${group.length} todos for list ${label}`);
  }

  console.log("Backfill complete");
}

main()
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


