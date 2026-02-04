import { getPrisma } from "@/lib/db";
import { dateKeyUTC, toUTCDate } from "@/lib/rosterDate";

export type Section = "FREE" | "YARD_SHOP" | "NO_WORK";
export type Emp = { id: string; name: string };
export type DayRosterData = { dateISO: string; free: Emp[]; yardShop: Emp[]; noWork: Emp[] };

export async function getDayRoster(dateISO: string): Promise<DayRosterData> {
  const dayKey = dateKeyUTC(dateISO);
  
  // Placement model not available
  return { dateISO: dayKey, free: [], yardShop: [], noWork: [] };
}
