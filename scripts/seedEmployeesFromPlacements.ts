import { getPrisma } from "../src/lib/db";

async function seedEmployeesFromPlacements() {
  const prisma = await getPrisma();
  
  // Get all unique employee IDs from existing placements
  const placements = await prisma.placement.findMany({
    select: { employeeId: true },
    distinct: ['employeeId'],
  });

  console.log(`Found ${placements.length} unique employee IDs in placements`);

  // Create employee records for each
  for (const p of placements) {
    await prisma.employee.upsert({
      where: { id: p.employeeId },
      update: {},
      create: { 
        id: p.employeeId,
        active: true,
      },
    });
  }

  console.log("✅ Employees seeded from placements!");
}

seedEmployeesFromPlacements().catch(console.error);


