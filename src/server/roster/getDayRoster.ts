import { getPrisma } from "@/lib/db";
import { dateKeyUTC, toUTCDate } from "@/lib/rosterDate";

export type Section = "FREE" | "YARD_SHOP" | "NO_WORK";
export type Emp = { id: string; name: string };
export type DayRosterData = { dateISO: string; free: Emp[]; yardShop: Emp[]; noWork: Emp[] };

export async function getDayRoster(dateISO: string): Promise<DayRosterData> {
  const dayKey = dateKeyUTC(dateISO);
  const date = toUTCDate(dayKey);

  const prisma = await getPrisma();
  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, defaultSection: true }, // defaultSection may be null if older rows
  });

  const assignments = await prisma.employeeAssignment.findMany({
    where: { date },
    select: { employeeId: true, section: true },
  });
  const explicit = new Map(assignments.map((a: { employeeId: string; section: string }) => [a.employeeId, a.section as Section]));

  const free: Emp[] = [];
  const yardShop: Emp[] = [];
  const noWork: Emp[] = [];

  for (const e of employees) {
    const fallback: Section =
      (e.defaultSection as Section | null | undefined) ?? "YARD_SHOP"; // your default behavior
    const explicitSection: Section | undefined = explicit.get(e.id) as Section | undefined;
    const section: Section = explicitSection ?? fallback;

    const item = { id: e.id, name: e.name };
    if (section === "FREE") free.push(item);
    else if (section === "NO_WORK") noWork.push(item);
    else yardShop.push(item);
  }

  // Debug: print arrays to verify the employee positions, not just counts
  const dbg = {
    dateISO: dayKey,
    counts: { free: free.length, yardShop: yardShop.length, noWork: noWork.length },
    sample: {
      free: free.slice(0, 5).map(e => e.id),
      yardShop: yardShop.slice(0, 5).map(e => e.id),
      noWork: noWork.slice(0, 5).map(e => e.id),
      explicitKeys: Array.from(explicit.keys()).slice(0, 5),
    },
  };
  console.log("getDayRoster dbg", dbg);

  // Watch specific employee
  const watch = "edilberto-acuna";
  console.log("watch placements", {
    free: free.some(e => e.id === watch),
    yardShop: yardShop.some(e => e.id === watch),
    noWork: noWork.some(e => e.id === watch),
    explicitHas: explicit.has(watch),
    explicitVal: explicit.get(watch) ?? null,
  });

  return { dateISO: dayKey, free, yardShop, noWork };
}
