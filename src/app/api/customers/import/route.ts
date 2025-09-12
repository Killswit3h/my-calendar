import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { normalizeCustomerName, parseCsv } from "../../../../lib/customers";

function pickName(row: Record<string, string>): string {
  const keys = Object.keys(row);
  // Build case-insensitive map of header -> original header
  const map = new Map<string, string>(keys.map(k => [k.trim().toLowerCase(), k]));
  const preferred = ["display name", "company", "customer", "name"];
  for (const key of preferred) {
    const orig = map.get(key);
    if (orig) {
      const v = (row[orig] ?? "").trim();
      if (v) return v;
    }
  }
  // Fallback: any header that contains customer/name
  for (const [lc, orig] of map) {
    if ((lc.includes("customer") || lc.includes("name")) && row[orig]?.trim()) {
      return row[orig].trim();
    }
  }
  // Last resort: join all non-empty cells (helps when commas split one column)
  const vals = keys.map(k => (row[k] ?? "").trim()).filter(Boolean);
  if (vals.length) return vals.join(", ");
  return "";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
    const fname = (file as any)?.name as string | undefined;
    if (!fname || !/\.csv$/i.test(fname)) {
      return NextResponse.json({ error: "not_csv", message: "Please upload a .csv file (Save As → CSV UTF-8)" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }
    const text = await file.text();
    const rows = parseCsv(text);
    const seen = new Set<string>();
    let total = 0, inserted = 0, skipped = 0, errors = 0;
    const errorMap = new Map<string, number>();
    for (const row of rows) {
      total++;
      const nameRaw = pickName(row);
      const { compare, display } = normalizeCustomerName(nameRaw);
      if (!display) { skipped++; continue; }
      if (seen.has(compare)) { skipped++; continue; }
      seen.add(compare);
      try {
        const existing = await prisma.customer.findFirst({ where: { name: { equals: display, mode: "insensitive" } } });
        if (existing) { skipped++; continue; }
        await prisma.customer.create({ data: { name: display } });
        inserted++;
      } catch (e: any) {
        errors++;
        const msg = (e?.message || 'failed').toString().slice(0, 120);
        errorMap.set(msg, (errorMap.get(msg) ?? 0) + 1);
      }
    }
    console.log(`[import-customers] ${new Date().toISOString()} total=${total} inserted=${inserted} skipped=${skipped} errors=${errors}`);
    const topErrors = Array.from(errorMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 3).map(([message, count])=>({ message, count }));
    return NextResponse.json({ total, inserted, skipped, errors, topErrors });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
export const runtime = 'edge'
