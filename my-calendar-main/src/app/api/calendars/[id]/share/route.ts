import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Next 15: await params
  const tokens = await prisma.shareToken.findMany({
    where: { calendarId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
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

  const token = await prisma.shareToken.create({
    data: { calendarId: id, role, expiresAt },
  });

  return NextResponse.json(token, { status: 201 });
}
