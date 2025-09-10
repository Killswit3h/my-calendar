// src/app/api/events/[id]/attachment/route.ts
export const runtime = 'edge'
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let ev: any = null;
  try {
    ev = await prisma.event.findUnique({
      where: { id },
      select: { attachmentData: true, attachmentName: true, attachmentType: true },
    });
  } catch (e: any) {
    const msg = (e?.message || "").toString();
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      return new Response(JSON.stringify({ error: "Database unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    throw e;
  }

  if (!ev || !ev.attachmentData) {
    return new Response(JSON.stringify({ error: "No attachment" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // Prisma Edge returns Uint8Array for Bytes; cast defensively
  const data: any = ev.attachmentData
  const body = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);

  const filename = (ev.attachmentName ?? "file").replace(/\//g, "");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": ev.attachmentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
