import { createReadStream, promises as fs } from "fs";
import { join } from "path";
import os from "os";
import crypto from "crypto";
import { put } from "@vercel/blob";

export type StoredFile = { url: string; bytes: number; kind: string; local?: boolean; id?: string };

function getTmpDir() {
  // Use OS temp dir with a namespaced subfolder to avoid permission issues (e.g., C:\tmp may not exist)
  return join(os.tmpdir(), "mycal-reports");
}

export async function storeFile(kind: string, filename: string, contentType: string, data: Buffer): Promise<StoredFile> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const res = await put(filename, data, { access: "public", contentType, token });
    return { url: res.url, bytes: data.byteLength, kind };
  }
  const id = crypto.randomBytes(16).toString("hex");
  const dir = getTmpDir();
  await fs.mkdir(dir, { recursive: true });
  const p = join(dir, id);
  await fs.writeFile(p, data);
  const url = `/api/reports/tmp/${id}?name=${encodeURIComponent(filename)}`;
  return { url, bytes: data.byteLength, kind, local: true, id };
}

export function openTmpFile(id: string) {
  const p = join(getTmpDir(), id);
  return createReadStream(p);
}
