export const runtime = 'nodejs'
import { NextResponse } from "next/server";
import { prisma, tryPrisma } from "@/lib/dbSafe";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Next 15: await params
  const tokens = await tryPrisma(() =>
    prisma.shareToken.findMany({
      where: { calendarId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
  , []);
  return NextResponse.json(tokens);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const role = body.role === "EDITOR" ? "EDITOR" : "VIEWER";
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  try {
    const token = await prisma.shareToken.create({
      data: { calendarId: id, role, expiresAt },
    });
    return NextResponse.json(token, { status: 201 });
  } catch (e: any) {
    const msg = (e?.message || "").toString();
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
  
}
