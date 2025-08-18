// src/app/api/events/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenRole, canWrite } from "@/lib/perm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  const ev = await prisma.event.findUnique({
    where: { id },
    select: { calendarId: true },
  });
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getTokenRole({ token, calendarId: ev.calendarId });
  if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  // attachment handling
  let attachPatch: any = {};
  if (body.attachment?.delete === true) {
    attachPatch = {
      attachmentData: null,
      attachmentName: null,
      attachmentType: null,
    };
  } else if (body.attachment?.base64) {
    const b64 = body.attachment.base64.includes(",")
      ? body.attachment.base64.split(",")[1]
      : body.attachment.base64;
    const buf = Buffer.from(b64, "base64");
    attachPatch = {
      attachmentData: buf,
      attachmentName: body.attachment.name || "file",
      attachmentType: body.attachment.type || "application/octet-stream",
    };
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.allDay !== undefined ? { allDay: body.allDay } : {}),
      ...(body.startsAt !== undefined ? { startsAt: new Date(body.startsAt) } : {}),
      ...(body.endsAt !== undefined ? { endsAt: new Date(body.endsAt) } : {}),
      ...attachPatch,
    },
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

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  const ev = await prisma.event.findUnique({
    where: { id },
    select: { calendarId: true },
  });
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getTokenRole({ token, calendarId: ev.calendarId });
  if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
