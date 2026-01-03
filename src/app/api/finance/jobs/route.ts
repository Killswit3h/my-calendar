import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}
import { NextResponse } from "next/server";
import { computeFinanceRows } from "@/lib/finance/compute";

export async function GET() {
  try {
    const rows = await computeFinanceRows();
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
