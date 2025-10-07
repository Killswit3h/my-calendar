import { NextRequest } from "next/server";
import { readMemFile, readDiskFile } from "@/server/blob";
import { getEventsForDay } from "@/server/reports/queries";
import { snapshotsToPdf } from "@/server/reports/pdfEdge";
import { APP_TZ } from '@/lib/appConfig';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const m = readMemFile(id) ?? readDiskFile(id);
    // If not found in memory or disk, try to regenerate from the requested filename
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || (m as any)?.name || 'download.bin';

    let body: Uint8Array;
    let contentType = (m as any)?.type || 'application/octet-stream';
    if (m) {
      body = new Uint8Array(m.data);
      if (!/\.pdf$|\.xlsx$/i.test(name)) {
        // best effort type
        contentType = contentType || 'application/octet-stream';
      }
    } else {
      // Regenerate on the fly for PDFs named like daily-YYYY-MM-DD[-vendor].pdf
      const pdfMatch = name.match(/^daily-(\d{4}-\d{2}-\d{2})(?:-([a-z]+))?\.pdf$/i);
      if (!pdfMatch) return new Response("Not found", { status: 404 });
      const dateYmd = pdfMatch[1];
      const vendor = pdfMatch[2] ? pdfMatch[2].toUpperCase() : null;
      const snapshot = await getEventsForDay(dateYmd, vendor);
      const tz = APP_TZ;
      const pdf = await snapshotsToPdf([snapshot], vendor, tz);
      body = new Uint8Array(pdf);
      contentType = 'application/pdf';
    }
    const rs = new ReadableStream({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      }
    });
    const headers = new Headers();
    headers.set('Content-Disposition', `inline; filename="${name}"`);
    // Basic type sniff from extension
    if (/\.pdf$/i.test(name)) headers.set('Content-Type', 'application/pdf');
    else if (/\.xlsx$/i.test(name)) headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    else headers.set('Content-Type', contentType || 'application/octet-stream');
    return new Response(rs, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
