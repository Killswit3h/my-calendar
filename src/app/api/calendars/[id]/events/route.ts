import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenRole, canWrite } from "@/lib/perm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ Next 15: await params
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const events = await prisma.event.findMany({
    where: {
      calendarId: id,
      ...(from && to
        ? {
            OR: [
              { startsAt: { gte: new Date(from), lt: new Date(to) } },
              { endsAt: { gte: new Date(from), lt: new Date(to) } },
            ],
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  const role = await getTokenRole(token, id);
  if (!canWrite(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const ev = await prisma.event.create({
    data: {
      calendarId: id,
      title: body.title,
      description: body.description ?? null,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      allDay: !!body.allDay,
      location: body.location ?? null,
      color: body.color ?? null,
    },
  });
  return NextResponse.json(ev, { status: 201 });
}
