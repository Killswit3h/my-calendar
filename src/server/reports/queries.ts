import { prisma } from "@/lib/prisma";

export type ReportRow = {
  project: string;
  invoice: string;
  crew: string[];
  work: string; // FENCE/GUARDRAIL/SHOP/NO WORK/...
  payroll: string[]; // e.g. ["Daily" ,"Bonus"]
  payment: string; // Daily | Adjusted
  vendor: string | null;
  timeUnit: string; // Day | Hour | Lump Sum
  notes: string;
};

export type DaySnapshot = {
  dateYmd: string; // YYYY-MM-DD in REPORT_TIMEZONE
  vendor: string | null;
  rows: ReportRow[];
};

function getTz(): string { return process.env.REPORT_TIMEZONE || "America/New_York"; }

function toTzDate(d: Date, tz: string): Date {
  // Convert Date to the same wall-clock in tz by formatting and parsing
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || "0");
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")));
}

function dayStartEnd(date: string, tz = getTz()): { start: Date; end: Date } {
  // date is YYYY-MM-DD in tz
  const [y, m, d] = date.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  // Adjust to tz wall clock by shifting via toTzDate reverse
  // Our Event timestamps are stored in UTC (Prisma DateTime). Intersect by UTC range for the tz day.
  const s = toTzDate(start, tz);
  const e = toTzDate(end, tz);
  return { start: s, end: e };
}

function parseMeta(description: string): { invoice: string; vendor: string | null; payment: string; payroll: string[]; notes: string } {
  const lines = (description || "").split(/\r?\n/);
  let invoice = "";
  let vendor: string | null = null;
  let payment = "";
  const payroll: string[] = [];
  const rest: string[] = [];
  for (const ln of lines) {
    const mInv = ln.match(/^\s*invoice\s*#?\s*:\s*(.+)$/i);
    if (mInv && !invoice) { invoice = mInv[1].trim(); continue; }
    const mVen = ln.match(/^\s*vendor\s*:\s*(.+)$/i);
    if (mVen && !vendor) { vendor = mVen[1].trim(); continue; }
    const mPay = ln.match(/^\s*payment\s*:\s*(.+)$/i);
    if (mPay && !payment) { payment = mPay[1].trim(); continue; }
    const mPr = ln.match(/^\s*payroll\s*:\s*(.+)$/i);
    if (mPr) { const v = mPr[1].trim(); if (v) payroll.push(v); continue; }
    rest.push(ln);
  }
  return { invoice, vendor, payment, payroll, notes: rest.join("\n").trim() };
}

function workFromType(type: string | null, notes: string): string {
  const t = (type || "").toUpperCase();
  const n = (notes || "").toUpperCase();
  if (n.includes("NO WORK")) return "NO WORK";
  if (n.includes("SHOP")) return "SHOP";
  if (t) return t;
  return "";
}

export async function getEventsForDay(dateYmd: string, vendor?: string | null): Promise<DaySnapshot> {
  const { start, end } = dayStartEnd(dateYmd);
  const rowsDb = await prisma.event.findMany({
    where: { OR: [ { startsAt: { lte: end }, endsAt: { gte: start } } ] },
    orderBy: [{ title: "asc" }, { startsAt: "asc" }],
    select: { title: true, description: true, type: true, checklist: true },
  });
  const all: ReportRow[] = rowsDb.map((e: { title: string | null; description: string | null; type: any; checklist: any }) => {
    const meta = parseMeta(e.description || "");
    const crew: string[] = Array.isArray((e.checklist as any)?.employees) ? ((e.checklist as any).employees as string[]) : [];
    const work = workFromType((e.type as any) || null, meta.notes);
    const timeUnit = (/adjusted/i.test(meta.payment)) ? "Hour" : "Day";
    return {
      project: e.title || "",
      invoice: meta.invoice,
      crew,
      work,
      payroll: meta.payroll.length ? meta.payroll : [],
      payment: meta.payment || "",
      vendor: meta.vendor ? meta.vendor.toUpperCase() : null,
      timeUnit,
      notes: meta.notes,
    };
  });
  const filtered = vendor ? all.filter(r => (r.vendor || "").toUpperCase() === vendor.toUpperCase()) : all;
  filtered.sort((a, b) => a.project.localeCompare(b.project) || a.invoice.localeCompare(b.invoice));
  return { dateYmd, vendor: vendor ?? null, rows: filtered };
}

export async function getEventsForWeek(mondayYmd: string, sundayYmd: string, vendor?: string | null): Promise<DaySnapshot[]> {
  const start = new Date(mondayYmd);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime()); d.setUTCDate(d.getUTCDate() + i);
    days.push(d.toISOString().slice(0,10));
  }
  const out: DaySnapshot[] = [];
  for (const ymd of days) {
    out.push(await getEventsForDay(ymd, vendor ?? null));
  }
  return out;
}
