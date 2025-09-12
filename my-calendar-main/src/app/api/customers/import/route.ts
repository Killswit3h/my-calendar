import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeCustomerName, parseCsv } from "@/lib/customers";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }
    const text = await file.text();
    const rows = parseCsv(text);
    const seen = new Set<string>();
    let total = 0, inserted = 0, skipped = 0, errors = 0;
    for (const row of rows) {
      total++;
      const nameRaw = row["Display Name"] || row["Company"] || row["Customer"] || "";
      const { compare, display } = normalizeCustomerName(nameRaw);
      if (!display) { skipped++; continue; }
      if (seen.has(compare)) { skipped++; continue; }
      seen.add(compare);
      try {
        const existing = await prisma.customer.findFirst({ where: { name: { equals: display, mode: "insensitive" } } });
        if (existing) { skipped++; continue; }
        await prisma.customer.create({ data: { name: display } });
        inserted++;
      } catch {
        errors++;
      }
    }
    console.log(`[import-customers] ${new Date().toISOString()} total=${total} inserted=${inserted} skipped=${skipped} errors=${errors}`);
    return NextResponse.json({ total, inserted, skipped, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
