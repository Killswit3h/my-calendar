import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenRole, canWrite } from "@/lib/perm";

async function getCalendarIdForEvent(eventId: string) {
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { calendarId: true },
  });
  return ev?.calendarId ?? null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  const calendarId = await getCalendarIdForEvent(id);
  const role = await getTokenRole(token, calendarId || undefined);
  if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(body.title ? { title: body.title } : {}),
      ...(body.startsAt ? { startsAt: new Date(body.startsAt) } : {}),
      ...(body.endsAt ? { endsAt: new Date(body.endsAt) } : {}),
      ...(typeof body.allDay === "boolean" ? { allDay: body.allDay } : {}),
      ...(body.description ? { description: body.description } : {}),
      ...(body.location ? { location: body.location } : {}),
      ...(body.color ? { color: body.color } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  const calendarId = await getCalendarIdForEvent(id);
  const role = await getTokenRole(token, calendarId || undefined);
  if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
