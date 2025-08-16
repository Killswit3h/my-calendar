import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenRole, canWrite } from "@/lib/perm";

// GET /api/calendars/:id/events?from=...&to=...[&token=...]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const token = searchParams.get("token") || undefined;

  const events = await prisma.event.findMany({
    where: {
      calendarId: id,
      ...(from && to
        ? {
            OR: [
              { startsAt: { gte: new Date(from), lte: new Date(to) } },
              { endsAt: { gte: new Date(from), lte: new Date(to) } },
            ],
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(events);
}

// POST /api/calendars/:id/events  (create)
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

  // Optional base64 attachment (small files only)
  let attachmentData: Buffer | undefined;
  if (body.attachmentBase64) {
    try {
      attachmentData = Buffer.from(body.attachmentBase64, "base64");
    } catch {
      return NextResponse.json({ error: "Invalid attachment" }, { status: 400 });
    }
  }

  const created = await prisma.event.create({
    data: {
      calendarId: id,
      title: body.title,
      description: body.description || null,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      allDay: true, // keep all-day
      location: body.location || null,
      type: body.type || null, // "GUARDRAIL" | "FENCE" | ...
      attachmentName: body.attachmentName || null,
      attachmentType: body.attachmentType || null,
      attachmentData: attachmentData ?? null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
