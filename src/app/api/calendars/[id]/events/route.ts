// src/app/api/calendars/[id]/events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenRole, canWrite } from "@/lib/perm";

// GET /api/calendars/:id/events
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const events = await prisma.event.findMany({
    where: { calendarId: id },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      calendarId: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      location: true,
      type: true,
      createdAt: true,
      attachmentName: true,
      attachmentType: true,
    },
  });

  return NextResponse.json(events);
}

// POST /api/calendars/:id/events
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || undefined;

  const role = await getTokenRole({ token, calendarId: id });
  if (!canWrite(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const created = await prisma.event.create({
    data: {
      calendarId: id,
      title: body.title ?? "Untitled",
      description: body.description ?? null,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      allDay: true,
      location: body.location ?? null,
      type: body.type ?? "GUARDRAIL",
      attachmentName: body.attachmentName ?? null,
      attachmentType: body.attachmentType ?? null,
      attachmentData: body.attachmentData
        ? Buffer.from(body.attachmentData, "base64")
        : null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
