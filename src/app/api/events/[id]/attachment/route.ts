import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/events/:id/attachment
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ev = await prisma.event.findUnique({
    where: { id },
    select: { attachmentData: true, attachmentName: true, attachmentType: true },
  });
  if (!ev || !ev.attachmentData) {
    return NextResponse.json({ error: "No attachment" }, { status: 404 });
  }

  return new NextResponse(ev.attachmentData, {
    status: 200,
    headers: {
      "Content-Type": ev.attachmentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${ev.attachmentName || "file"}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
