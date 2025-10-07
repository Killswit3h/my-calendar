
import { put } from "@vercel/blob";
import fs from 'fs';
import path from 'path';

export type StoredFile = { url: string; bytes: number; kind: string; local?: boolean; id?: string };

// In-memory fallback store for local/dev without Blob token.
const mem = new Map<string, { data: Uint8Array; type: string }>();
const DISK_DIR = path.join(process.cwd(), 'artifacts', 'reports');
function ensureDir() {
  try { fs.mkdirSync(DISK_DIR, { recursive: true }); } catch {}
}

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }

export async function storeFile(kind: string, filename: string, contentType: string, data: Uint8Array | Buffer): Promise<StoredFile> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (token) {
    // Vercel Blob expects a PutBody: Blob | File | Buffer | Readable | ReadableStream
    // Always provide a Blob with a real ArrayBuffer (avoid SharedArrayBuffer typing issues)
    const view = buf as Uint8Array;
    const ab = new ArrayBuffer(view.byteLength);
    new Uint8Array(ab).set(view);
    const body: any = (typeof Blob !== 'undefined') ? new Blob([ab], { type: contentType }) : (typeof Buffer !== 'undefined' ? Buffer.from(view) : view);
    const res = await put(filename, body as any, { access: "public", contentType, token });
    return { url: res.url, bytes: view.byteLength, kind };
  }
  const id = uid();
  mem.set(id, { data: buf, type: contentType });
  // Also persist to disk in dev/local so it survives route reloads
  try {
    ensureDir();
    const meta = { type: contentType, name: filename };
    fs.writeFileSync(path.join(DISK_DIR, `${id}.bin`), Buffer.from(buf));
    fs.writeFileSync(path.join(DISK_DIR, `${id}.json`), JSON.stringify(meta));
  } catch {}
  const url = `/api/reports/tmp/${id}?name=${encodeURIComponent(filename)}`;
  return { url, bytes: buf.byteLength, kind, local: true, id };
}

export function readMemFile(id: string): { data: Uint8Array; type: string } | null {
  return mem.get(id) || null;
}

export function readDiskFile(id: string): { data: Uint8Array; type: string; name?: string } | null {
  try {
    const bin = path.join(DISK_DIR, `${id}.bin`);
    const j = path.join(DISK_DIR, `${id}.json`);
    if (!fs.existsSync(bin)) return null;
    const data = fs.readFileSync(bin);
    let type = 'application/octet-stream';
    let name: string | undefined;
    if (fs.existsSync(j)) {
      try { const meta = JSON.parse(fs.readFileSync(j, 'utf8')); type = meta.type || type; name = meta.name; } catch {}
    }
    return { data: new Uint8Array(data), type, name };
  } catch {
    return null;
  }
}
