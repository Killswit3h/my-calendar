
import { put } from "@vercel/blob";

export type StoredFile = { url: string; bytes: number; kind: string; local?: boolean; id?: string };

// In-memory fallback store for local/dev without Blob token.
const mem = new Map<string, { data: Uint8Array; type: string }>();

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }

export async function storeFile(kind: string, filename: string, contentType: string, data: Uint8Array | Buffer): Promise<StoredFile> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (token) {
    const res = await put(filename, buf, { access: "public", contentType, token });
    return { url: res.url, bytes: buf.byteLength, kind };
  }
  const id = uid();
  mem.set(id, { data: buf, type: contentType });
  const url = `/api/reports/tmp/${id}?name=${encodeURIComponent(filename)}`;
  return { url, bytes: buf.byteLength, kind, local: true, id };
}

export function readMemFile(id: string): { data: Uint8Array; type: string } | null {
  return mem.get(id) || null;
}
