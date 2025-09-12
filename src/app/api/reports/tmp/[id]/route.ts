import { NextRequest } from "next/server";
import { readMemFile } from "@/server/blob";

export const runtime = 'nodejs'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const mem = readMemFile(id);
    if (!mem) return new Response("Not found", { status: 404 });
    const body = new Uint8Array(mem.data);
    const rs = new ReadableStream({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      }
    });
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || 'download.bin';
    const headers = new Headers();
    headers.set('Content-Disposition', `inline; filename="${name}"`);
    // Basic type sniff from extension
    if (/\.pdf$/i.test(name)) headers.set('Content-Type', 'application/pdf');
    else if (/\.xlsx$/i.test(name)) headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    else headers.set('Content-Type', 'application/octet-stream');
    return new Response(rs, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
