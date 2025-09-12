import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeCustomerName } from "@/lib/customers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const item = await prisma.customer.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await prisma.customer.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({} as any));
    const nameRaw = typeof body?.name === "string" ? body.name : "";
    const { display } = normalizeCustomerName(nameRaw);
    if (!display) return NextResponse.json({ error: "blank" }, { status: 400 });
    // Check for duplicate name on another id
    const dup = await prisma.customer.findFirst({ where: { name: { equals: display, mode: "insensitive" }, NOT: { id } } });
    if (dup) return NextResponse.json({ error: "duplicate" }, { status: 409 });
    const updated = await prisma.customer.update({ where: { id }, data: { name: display }, select: { id: true, name: true } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
export const runtime = 'nodejs'
