import { getPrisma } from "../src/lib/db";
import { getEmployees } from "../src/employees";

async function seedEmployees() {
  const prisma = await getPrisma();
  const employees = getEmployees();

  console.log(`Seeding ${employees.length} employees...`);

  for (const emp of employees) {
    const name = `${emp.firstName} ${emp.lastName}`;
    await prisma.employee.upsert({
      where: { firstName_lastName: { firstName: emp.firstName, lastName: emp.lastName } },
      update: { name, defaultSection: "YARD_SHOP" },
      create: {
        id: emp.id,
        name,
        firstName: emp.firstName,
        lastName: emp.lastName,
        defaultSection: "YARD_SHOP",
      },
    });
  }

  console.log("✅ Employees seeded successfully!");
}

seedEmployees().catch(console.error);



